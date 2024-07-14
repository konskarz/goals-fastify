'use strict'

import { randomUUID } from 'node:crypto'

/** @param {import('fastify').FastifyInstance} app */
export default async function group(app, opts) {
  const { task: entity } = app.platformatic.entities
  const schemaDefaults = { tags: ['tasks'], security: [{ bearerAuth: [] }] }
  const schemaInput = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      target: { type: 'number' },
      done: { type: 'string' },
      description: { type: 'string' },
      goal: { type: 'number' }
    }
  }
  const schemaInputCreate = Object.assign({}, schemaInput, {
    properties: {
      ...schemaInput.properties,
      planned: { type: 'string' },
      recurringUntil: { type: 'string' }
    },
    required: ['name', 'planned', 'recurringUntil']
  })

  app.post(
    '/',
    {
      schema: {
        ...schemaDefaults,
        body: schemaInputCreate,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const startDate = new Date(request.body.planned)
      const endDate = new Date(request.body.recurringUntil)
      const msWeek = 1000 * 60 * 60 * 24 * 7
      const numberOfWeeks = Math.floor((endDate - startDate) / msWeek)
      if (numberOfWeeks < 0) throw new Error('Incorrect recurringUntil value')
      const { name, target, done, description, goal } = request.body
      const inputDefaults = {
        name,
        target,
        done,
        description,
        goal,
        groupId: randomUUID(),
        userId: request.user.id
      }
      const inputs = []
      for (let i = 0; i <= numberOfWeeks; i++) {
        const planned = new Date(startDate.getTime() + msWeek * i)
        inputs.push({ ...inputDefaults, planned })
      }
      const res = await entity.insert({ inputs })
      return res
    }
  )

  app.patch(
    '/:groupId',
    {
      schema: {
        ...schemaDefaults,
        body: schemaInput,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const res = await entity.updateMany({
        where: { groupId: { eq: request.params.groupId } },
        input: request.body
      })
      return res
    }
  )

  app.delete(
    '/:groupId',
    {
      schema: {
        ...schemaDefaults,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const res = await entity.delete({ where: { groupId: { eq: request.params.groupId } } })
      return res.length === 0 ? reply.callNotFound() : res
    }
  )
}
