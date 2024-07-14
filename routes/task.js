'use strict'

/** @param {import('fastify').FastifyInstance} app */
export default async function task(app, opts) {
  const { task: entity } = app.platformatic.entities
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
  // TODO: move to FE
  async function updatePerformanceHistory(item) {
    const now = new Date()
    item.performanceHistory.unshift({ value: item.performance, updated: now })
    const input = {
      id: item.id,
      // Invalid syntax for type json on arrays: https://github.com/brianc/node-postgres/issues/442
      performanceHistory: JSON.stringify(item.performanceHistory)
    }
    if (
      item.target &&
      ((!item.done && item.performance >= item.target) ||
        (item.done && item.performance < item.target))
    ) {
      input.done = item.done ? null : now
    }
    const res = await entity.save({ input })
    return res
  }

  // TODO: rename performance_history, group_id, recurring_until in FE
  app.addSchema({
    $id: 'Task',
    type: 'object',
    properties: {
      id: { type: 'number' },
      ...schemaInput.properties,
      performanceHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: { value: { type: 'number' }, updated: { type: 'string' } }
        }
      }
    }
  })

  app.get(
    '/',
    {
      schema: { ...schemaDefaults, response: { 200: { type: 'array', items: { $ref: 'Task#' } } } }
    },
    async (request, reply) => {
      const res = await entity.find({ where: { userId: { eq: request.user.id } } })
      return res
    }
  )

  app.post(
    '/',
    {
      schema: {
        ...schemaDefaults,
        body: { ...schemaInput, required: ['name', 'planned'] },
        response: { 200: { $ref: 'Task#' } }
      }
    },
    async (request, reply) => {
      const res = await entity.save({ input: { ...request.body, userId: request.user.id } })
      return request.body.performance ? await updatePerformanceHistory(res) : res
    }
  )

  app.get(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Task#' } } } },
    async (request, reply) => {
      const res = await entity.find({ where: { id: { eq: request.params.id } } })
      return res.length === 0 ? reply.callNotFound() : res[0]
    }
  )

  app.patch(
    '/:id',
    { schema: { ...schemaDefaults, body: schemaInput, response: { 200: { $ref: 'Task#' } } } },
    async (request, reply) => {
      const res = await entity.save({ input: { id: request.params.id, ...request.body } })
      return request.body.performance ? await updatePerformanceHistory(res) : res
    }
  )

  app.delete(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Task#' } } } },
    async (request, reply) => {
      const res = await entity.delete({ where: { id: { eq: request.params.id } } })
      return res.length === 0 ? reply.callNotFound() : res[0]
    }
  )

  app.register(import('./group.js'), { prefix: '/recurring' })
}
