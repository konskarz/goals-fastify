import bcrypt from 'bcryptjs'

/** @param {import('fastify').FastifyInstance} fastify */
export default async function user (fastify, options) {
  const { user: entity } = fastify.platformatic.entities

  fastify.addSchema({
    $id: 'User',
    type: 'object',
    properties: {
      username: { type: 'string' },
      password: { type: 'string' }
    },
    required: ['username', 'password']
  })

  fastify.post('/register', {
    schema: {
      body: { $ref: 'User#' },
      response: {
        500: { $ref: 'HttpError' },
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    try {
      await entity.save({
        input: { username, password: hashedPassword }
      })
      return reply.code(201).send({ message: 'Successfully registered' })
    } catch (error) {
      return reply.internalServerError()
    }
  })

  fastify.post('/auth', {
    schema: {
      body: { $ref: 'User#' },
      response: {
        500: { $ref: 'HttpError' },
        401: { $ref: 'HttpError' },
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body
    try {
      const [user] = await entity.find({
        where: { username: { eq: username } }
      })
      if (user && user.isActive && (await bcrypt.compare(password, user.password))) {
        const token = fastify.jwt.sign({ id: user.id })
        return reply.send({ token })
      } else {
        return reply.unauthorized()
      }
    } catch (error) {
      return reply.internalServerError()
    }
  })
}
