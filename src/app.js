import mapper from '@platformatic/sql-mapper'

/** @param {import('fastify').FastifyInstance} fastify */
export default async function app(fastify, options) {
  fastify.register(mapper.plugin, {
    connectionString: process.env.DATABASE_URL,
    limit: { default: 999999, max: 999999 }
  })
  fastify.register(import('@fastify/jwt'), { secret: process.env.JWT_SECRET })
  fastify.register(import('@fastify/swagger'), {
    openapi: {
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
      }
    }
  })
  fastify.register(import('@scalar/fastify-api-reference'), { routePrefix: '/' })
  fastify.register(import('./routes/user.js'))
  fastify.register(async function authenticated(fastify, options) {
    fastify.addHook('onRequest', (request) => request.jwtVerify())
    fastify.register(import('./routes/goal.js'), { prefix: '/goals' })
    fastify.register(import('./routes/task.js'), { prefix: '/tasks' })
    fastify.register(import('./routes/seed.js'), { prefix: '/seed' })
  })
}
