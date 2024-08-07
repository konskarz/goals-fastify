'use strict'

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
