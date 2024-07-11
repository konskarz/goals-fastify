/** @param {import('fastify').FastifyInstance} fastify */
export default async function goal(fastify, options) {
  const { goal: entity } = fastify.platformatic.entities
  const schemaDefaults = { tags: ['goals'], security: [{ bearerAuth: [] }] }
  const schemaInput = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      planned: { type: 'string' },
      description: { type: 'string' },
      parent: { type: 'number' }
    }
  }

  fastify.addSchema({
    $id: 'Goal',
    type: 'object',
    properties: { id: { type: 'number' }, ...schemaInput.properties }
  })

  fastify.get(
    '/',
    {
      schema: {
        ...schemaDefaults,
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer' },
            offset: { type: 'integer' }
          }
        },
        response: { 200: { type: 'array', items: { $ref: 'Goal#' } } }
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

  fastify.post(
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

  fastify.get(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const res = await entity.find({ where: { id: { eq: request.params.id } } })
      return res.length === 0 ? reply.callNotFound() : res[0]
    }
  )

  fastify.patch(
    '/:id',
    { schema: { ...schemaDefaults, body: schemaInput, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const res = await entity.save({ input: { id: request.params.id, ...request.body } })
      return res
    }
  )

  fastify.delete(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const res = await entity.delete({ where: { id: { eq: request.params.id } } })
      return res.length === 0 ? reply.callNotFound() : res[0]
    }
  )
}
