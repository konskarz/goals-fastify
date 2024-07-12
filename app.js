'use strict'

import mapper from '@platformatic/sql-mapper'

/** @param {import('fastify').FastifyInstance} app */
export default async function goals(app, opts) {
  app.register(mapper.plugin, {
    connectionString: process.env.DATABASE_URL,
    ignore: { schemaversion: true },
    limit: { default: 999999, max: 999999 }
  })
  app.register(import('@fastify/jwt'), { secret: process.env.JWT_SECRET })
  app.register(import('@fastify/swagger'), {
    openapi: {
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
      }
    }
  })
  app.register(import('@scalar/fastify-api-reference'), { routePrefix: '/' })
  app.register(import('./routes/user.js'))
  app.register(async function authenticated(app, opts) {
    app.addHook('onRequest', (request) => request.jwtVerify())
    app.register(import('./routes/goal.js'), { prefix: '/goals' })
    app.register(import('./routes/task.js'), { prefix: '/tasks' })
    app.register(import('./routes/seed.js'), { prefix: '/seed' })
  })
}
