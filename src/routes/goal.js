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
    const user = request.user
    try {
      const items = await entity.find({
        where: { userId: { eq: user.id } }
      })
      return reply.send(items)
    } catch (error) {
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
    const user = request.user
    const { title, description } = request.body
    try {
      const item = await entity.save({
        input: { title, description, userId: user.id }
      })
      return reply.code(201).send(item)
    } catch (error) {
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
    const user = request.user
    const paramsId = request.params.id
    try {
      const [item] = await entity.find({
        where: { id: { eq: paramsId }, userId: { eq: user.id } }
      })
      if (item) {
        return reply.send(item)
      } else {
        return reply.notFound()
      }
    } catch (error) {
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
    const user = request.user
    const paramsId = request.params.id
    const { title, description } = request.body
    try {
      const item = await entity.save({
        input: { id: paramsId, title, description, userId: user.id }
      })
      return reply.send(item)
    } catch (error) {
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
    const user = request.user
    const paramsId = request.params.id
    try {
      await entity.delete({
        where: { id: { eq: paramsId }, userId: { eq: user.id } }
      })
      return reply.send({ message: paramsId + ' deleted successfully' })
    } catch (error) {
      return reply.internalServerError()
    }
  })
}
