'use strict'

import { randomUUID } from 'node:crypto'

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
    const res = await entity.save({ input })
    return res
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
    const res = await entity.insert({ inputs })
    return res[0]
  }

  // TODO: rename performance_history to performanceHistory in FE
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
          properties: {
            value: { type: 'number' },
            updated: { type: 'string' }
          }
        }
      }
    }
  })

  app.register(import('./recurring.js'), { prefix: '/recurring' })

  app.get(
    '/',
    {
      schema: {
        ...schemaDefaults,
        querystring: {
          type: 'object',
          properties: { limit: { type: 'integer' }, offset: { type: 'integer' } }
        },
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const res = await entity.find({
        where: { userId: { eq: request.user.id } },
        ...request.query
      })
      return res
    }
  )

  app.post(
    '/',
    {
      schema: {
        ...schemaDefaults,
        body: schemaInputCreate,
        response: { 200: { $ref: 'Task#' } }
      }
    },
    async (request, reply) => {
      // TODO: move to post: recurring
      if (request.body.recurring_until) return await createRecurringTasks(request, reply)
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
}
