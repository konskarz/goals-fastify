/** @param {import('fastify').FastifyInstance} fastify */
export default async function task(fastify, options) {
  const { task: entity } = fastify.platformatic.entities
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

  fastify.patch(
    '/:group_id',
    {
      schema: {
        ...schemaDefaults,
        body: schemaInput,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const res = await entity.updateMany({
        where: { groupId: { eq: request.params.group_id } },
        input: request.body
      })
      return res
    }
  )

  fastify.delete(
    '/:group_id',
    {
      schema: {
        ...schemaDefaults,
        response: { 200: { type: 'array', items: { $ref: 'Task#' } } }
      }
    },
    async (request, reply) => {
      const res = await entity.delete({ where: { groupId: { eq: request.params.group_id } } })
      return res.length === 0 ? reply.callNotFound() : res
    }
  )
}
