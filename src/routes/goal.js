/** @param {import('fastify').FastifyInstance} fastify */
export default async function goal (fastify, options) {
  const { goal: entity } = fastify.platformatic.entities
  const schemaDefaults = {
    tags: ['goals'],
    security: [{ bearerAuth: [] }]
  }
  const schemaBody = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      planned: { type: 'string' },
      description: { type: 'string' },
      parent: { type: 'number' }
    },
    required: ['name']
  }

  fastify.addSchema({
    $id: 'Goal',
    type: 'object',
    properties: {
      id: { type: 'number' },
      ...schemaBody.properties
    }
  })

  fastify.get('/', {
    schema: {
      ...schemaDefaults,
      response: {
        500: { $ref: 'HttpError' },
        200: {
          type: 'array',
          items: { $ref: 'Goal#' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await entity.find({
        where: { userId: { eq: request.user.id } }
      })
      return reply.send(result)
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError()
    }
  })

  fastify.post('/', {
    schema: {
      ...schemaDefaults,
      body: schemaBody,
      response: {
        500: { $ref: 'HttpError' },
        201: { $ref: 'Goal#' }
      }
    }
  }, async (request, reply) => {
    const { name, planned, description, parent } = request.body
    try {
      const result = await entity.save({
        input: { name, planned, description, parent, userId: request.user.id }
      })
      return reply.code(201).send(result)
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError()
    }
  })

  fastify.get('/:id', {
    schema: {
      ...schemaDefaults,
      response: {
        500: { $ref: 'HttpError' },
        404: { $ref: 'HttpError' },
        200: { $ref: 'Goal#' }
      }
    }
  }, async (request, reply) => {
    try {
      const [result] = await entity.find({
        where: { id: { eq: request.params.id }, userId: { eq: request.user.id } }
      })
      return result ? reply.send(result) : reply.notFound()
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError()
    }
  })

  fastify.put('/:id', {
    schema: {
      ...schemaDefaults,
      body: schemaBody,
      response: {
        500: { $ref: 'HttpError' },
        200: { $ref: 'Goal#' }
      }
    }
  }, async (request, reply) => {
    const { name, planned, description, parent } = request.body
    try {
      const result = await entity.save({
        input: { id: request.params.id, name, planned, description, parent, userId: request.user.id }
      })
      return reply.send(result)
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError()
    }
  })

  fastify.delete('/:id', {
    schema: {
      ...schemaDefaults,
      response: {
        500: { $ref: 'HttpError' },
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await entity.delete({
        where: { id: { eq: request.params.id }, userId: { eq: request.user.id } }
      })
      return reply.send({ message: 'Successfully deleted' })
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError()
    }
  })
}
