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
        response: { 200: { type: 'array', items: { $ref: 'Goal#' } } }
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
        body: { ...schemaInput, required: ['name'] },
        response: { 201: { $ref: 'Goal#' } }
      }
    },
    async (request, reply) => {
      const result = await entity.save({ input: { ...request.body, userId: request.user.id } })
      return reply.code(201).send(result)
    }
  )

  fastify.get(
    '/:id',
    { schema: { ...schemaDefaults, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const [result] = await entity.find({ where: { id: { eq: request.params.id } } })
      return result ? result : reply.callNotFound()
    }
  )

  fastify.patch(
    '/:id',
    { schema: { ...schemaDefaults, body: schemaInput, response: { 200: { $ref: 'Goal#' } } } },
    async (request, reply) => {
      const result = await entity.save({ input: { id: request.params.id, ...request.body } })
      return result
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
