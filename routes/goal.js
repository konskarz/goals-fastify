'use strict'

/** @param {import('fastify').FastifyInstance} app */
export default async function goal(app, opts) {
  const { goal: entity } = app.platformatic.entities
  const schemaDefaults = { tags: ['goals'], security: [{ bearerAuth: [] }] }
  const schemaInput = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      planned: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      parent: { type: 'integer', nullable: true }
    }
  }

  app.addSchema({
    $id: 'Goal',
    type: 'object',
    properties: { id: { type: 'integer' }, ...schemaInput.properties }
  })

  app.get(
    '/',
    {
      schema: { ...schemaDefaults, response: { 200: { type: 'array', items: { $ref: 'Goal#' } } } }
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
        body: { ...schemaInput, required: ['name'] },
        response: { 200: { $ref: 'Goal#' } }
      }
    },
    async (request, reply) => {
      const res = await entity.save({ input: { ...request.body, userId: request.user.id } })
      return res
    }
  )

  app.get(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const res = await entity.find({ where: { id: { eq: request.params.id } } })
      return res.length === 0 ? reply.callNotFound() : res[0]
    }
  )

  app.patch(
    '/:id',
    { schema: { ...schemaDefaults, body: schemaInput, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const res = await entity.save({ input: { id: request.params.id, ...request.body } })
      return res
    }
  )

  app.delete(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const res = await entity.delete({ where: { id: { eq: request.params.id } } })
      return res.length === 0 ? reply.callNotFound() : res[0]
    }
  )
}
