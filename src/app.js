/** @param {import('fastify').FastifyInstance} fastify */
export default async function app (fastify, options) {
  fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  })
}