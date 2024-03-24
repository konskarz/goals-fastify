import mapper from '@platformatic/sql-mapper'

/** @param {import('fastify').FastifyInstance} fastify */
export default async function app (fastify, options) {
  fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  })
  fastify.register(mapper.plugin, {
    connectionString: process.env.DATABASE_URL
  })
  fastify.register(import('@fastify/sensible'), {
    sharedSchemaId: 'HttpError'
  })
  fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
  })
  fastify.register(import('@fastify/swagger'), {
    openapi: {
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  })
  fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs'
  })
}
