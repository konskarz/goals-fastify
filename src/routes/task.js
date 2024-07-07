/** @param {import('fastify').FastifyInstance} fastify */
export default async function task (fastify, options) {
  const { task: entity } = fastify.platformatic.entities
  const schemaDefaults = {
    tags: ['tasks'],
    security: [{ bearerAuth: [] }]
  }
  const schemaBody = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      planned: { type: 'string' },
      target: { type: 'number' },
      performance: { type: 'number' },
      done: { type: 'string' },
      description: { type: 'string' },
      performance_history: { type: 'object' },
      group_id: { type: 'number' },
      goal: { type: 'number' }
    },
    required: ['name']
  }

  fastify.addSchema({
    $id: 'Task',
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
          items: { $ref: 'Task#' }
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
      return reply.internalServerError()
    }
  })

  fastify.post('/', {
    schema: {
      ...schemaDefaults,
      body: schemaBody,
      response: {
        500: { $ref: 'HttpError' },
        201: { $ref: 'Task#' }
      }
    }
  }, async (request, reply) => {
    const { name, planned, target, performance, done, description, goal } = request.body
    try {
      const result = await entity.save({
        input: { name, planned, target, performance, done, description, goal, userId: request.user.id }
      })
      return reply.code(201).send(result)
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
        200: { $ref: 'Task#' }
      }
    }
  }, async (request, reply) => {
    try {
      const [result] = await entity.find({
        where: { id: { eq: request.params.id }, userId: { eq: request.user.id } }
      })
      return result ? reply.send(result) : reply.notFound()
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
        200: { $ref: 'Task#' }
      }
    }
  }, async (request, reply) => {
    const { name, planned, target, performance, done, description, goal } = request.body
    try {
      const result = await entity.save({
        input: { id: request.params.id, name, planned, target, performance, done, description, goal, userId: request.user.id }
      })
      return reply.send(result)
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
    try {
      await entity.delete({
        where: { id: { eq: request.params.id }, userId: { eq: request.user.id } }
      })
      return reply.send({ message: 'Successfully deleted' })
    } catch (error) {
      return reply.internalServerError()
    }
  })
}