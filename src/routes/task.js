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
      group_id: { type: 'string' },
      goal: { type: 'number' }
    }
  }
  const schemaInputCreate = Object.assign({}, schemaInput, {
    properties: { ...schemaInput.properties, recurring_until: { type: 'string' } },
    required: ['name']
  })
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
        response: { 201: { $ref: 'Task#' } }
      }
    },
    async (request, reply) => {
      const result = await entity.save({ input: { ...request.body, userId: request.user.id } })
      return reply
        .code(201)
        .send(request.body.performance ? await updatePerformanceHistory(result) : result)
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
}
