'use strict'

import { randomBytes, pbkdf2Sync } from 'node:crypto'

/** @param {import('fastify').FastifyInstance} app */
export default async function user(app, opts) {
  const { user: entity } = app.platformatic.entities
  const iterations = 100000
  const keylen = 64
  const digest = 'sha512'
  function hash(password) {
    const salt = randomBytes(16).toString('hex')
    const hash = pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex')
    return [salt, hash].join('$')
  }
  function verify(password, stored) {
    const [salt, original] = stored.split('$')
    const hash = pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex')
    return hash === original
  }

  app.addSchema({
    $id: 'User',
    type: 'object',
    properties: { username: { type: 'string' }, password: { type: 'string' } },
    required: ['username', 'password']
  })

  app.post(
    '/register',
    { schema: { body: { $ref: 'User#' }, response: { 200: { $ref: 'User#' } } } },
    async (request, reply) => {
      const { username, password } = request.body
      const res = await entity.save({ input: { username, password: hash(password) } })
      return res
    }
  )

  app.post(
    '/auth',
    {
      schema: {
        body: { $ref: 'User#' },
        response: { 200: { type: 'object', properties: { token: { type: 'string' } } } }
      }
    },
    async (request, reply) => {
      const { username, password } = request.body
      const [user] = await entity.find({ where: { username: { eq: username } } })
      if (user && user.isActive && verify(password, user.password)) {
        const token = app.jwt.sign({ id: user.id })
        return { token }
      } else {
        return reply.callNotFound()
      }
    }
  )
}
