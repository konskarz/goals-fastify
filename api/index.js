import Fastify from 'fastify'

const app = Fastify({ logger: true })
app.register(import('../goals.js'))

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
