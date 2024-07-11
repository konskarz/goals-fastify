import { randomUUID } from 'node:crypto'

/** @param {import('fastify').FastifyInstance} fastify */
export default async function task(fastify, options) {
  const { task: entity } = fastify.platformatic.entities
  const schemaDefaults = { tags: ['tasks'], security: [{ bearerAuth: [] }] }
  const schemaInput = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      planned: { type: 'string' },
      target: { type: 'number' },
      performance: { type: 'number' },
      done: { type: 'string' },
      description: { type: 'string' },
      groupId: { type: 'string' },
      goal: { type: 'number' }
    }
  }
  const schemaInputCreate = Object.assign({}, schemaInput, {
    properties: { ...schemaInput.properties, recurring_until: { type: 'string' } },
    required: ['name']
  })
  const schemaRecurringInput = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      target: { type: 'number' },
      done: { type: 'string' },
      description: { type: 'string' },
      goal: { type: 'number' }
    }
  }
  // TODO: move Performance History Management to FE
  async function updatePerformanceHistory(item) {
    const now = new Date()
    item.performanceHistory.unshift({ value: item.performance, updated: now })
    const input = {
      id: item.id,
      // https://github.com/brianc/node-postgres/issues/442
      // https://github.com/brianc/node-postgres/issues/374
      performanceHistory: JSON.stringify(item.performanceHistory)
    }
    if (
      item.target &&
      ((!item.done && item.performance >= item.target) ||
        (item.done && item.performance < item.target))
    ) {
      input.done = item.done ? null : now
    }
    const result = await entity.save({ input })
    return result
  }
  async function createRecurringTasks(request, reply) {
    const fields = ['name', 'target', 'done', 'description', 'goal']
    const inputDefaults = Object.fromEntries(
      Object.entries(request.body).filter(([key, val]) => fields.includes(key))
    )
    inputDefaults.userId = request.user.id
    inputDefaults.groupId = randomUUID()
    const startDate = request.body.planned ? new Date(request.body.planned) : new Date()
    const endDate = new Date(request.body.recurring_until)
    const msWeek = 1000 * 60 * 60 * 24 * 7
    const numberOfWeeks = Math.floor((endDate - startDate) / msWeek)
    if (numberOfWeeks < 0) throw new Error('Incorrect recurring_until value')
    const inputs = []
    for (let i = 0; i <= numberOfWeeks; i++) {
      const planned = new Date(startDate.getTime() + msWeek * i)
      inputs.push({ ...inputDefaults, planned })
    }
    const result = await entity.insert({ inputs })
    return reply.code(201).send(result)
  }

  // TODO: rename performance_history to performanceHistory in FE
  fastify.addSchema({
    $id: 'Task',
    type: 'object',
    properties: {
      id: { type: 'number' },
      ...schemaInput.properties,
      performanceHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            updated: { type: 'string' }
          }
        }
      }
    }
  })

  fastify.get(
    '/',
    {
      schema: {
        ...schemaDefaults,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const result = await entity.find({ where: { userId: { eq: request.user.id } } })
      return result
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        ...schemaDefaults,
        body: schemaInputCreate,
        response: { 201: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      // TODO: move to post: recurring
      if (request.body.recurring_until) return await createRecurringTasks(request, reply)
      const result = await entity.save({ input: { ...request.body, userId: request.user.id } })
      return reply
        .code(201)
        .send(request.body.performance ? await updatePerformanceHistory(result) : [result])
    }
  )

  fastify.get(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Task#' } } } },
    async (request, reply) => {
      const [result] = await entity.find({ where: { id: { eq: request.params.id } } })
      return result ? result : reply.callNotFound()
    }
  )

  fastify.patch(
    '/:id',
    { schema: { ...schemaDefaults, body: schemaInput, response: { 200: { $ref: 'Task#' } } } },
    async (request, reply) => {
      const result = await entity.save({ input: { id: request.params.id, ...request.body } })
      return request.body.performance ? await updatePerformanceHistory(result) : result
    }
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        ...schemaDefaults,
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } }
      }
    },
    async (request, reply) => {
      await entity.delete({ where: { id: { eq: request.params.id } } })
      return { message: 'Successfully deleted' }
    }
  )

  fastify.patch(
    '/recurring/:group_id',
    {
      schema: {
        ...schemaDefaults,
        body: schemaRecurringInput,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const result = await entity.updateMany({
        where: { groupId: { eq: request.params.group_id } },
        input: request.body
      })
      return result
    }
  )

  fastify.delete(
    '/recurring/:group_id',
    {
      schema: {
        ...schemaDefaults,
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } } }
      }
    },
    async (request, reply) => {
      await entity.delete({ where: { groupId: { eq: request.params.group_id } } })
      return { message: 'Successfully deleted' }
    }
  )
}
