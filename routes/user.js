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
  async function seed(userId) {
    const { goal, task } = app.platformatic.entities
    await goal.delete({ where: { userId: { eq: userId } } })
    await task.delete({ where: { userId: { eq: userId } } })
    const goals = await goal.insert({
      inputs: [
        { name: 'Become happier with my own body', userId },
        { name: 'Improve my expert image on social media', userId },
        { name: 'Increase my productivity', userId },
        { name: 'Reach all-time high visitor count on blog', userId }
      ]
    })
    const today = new Date(),
      msWeek = 1000 * 60 * 60 * 24 * 7,
      week = [],
      inputs = []
    for (let i = 0; i < 5; i++) week[i] = new Date(today.getTime() + msWeek * i)
    inputs.push({
      name: 'Create a spreadsheet with the top 5 categories that interest me',
      goal: goals[3].id,
      planned: week[0],
      userId
    })
    inputs.push({
      name: 'Make light keyword research on those categories and note down ideas for blog post subjects',
      goal: goals[3].id,
      planned: week[0],
      userId
    })
    inputs.push({
      name: 'Complete an online course on time management',
      goal: goals[2].id,
      planned: week[0],
      userId
    })
    inputs.push({
      name: 'Install an anti-distraction app for my browser',
      goal: goals[2].id,
      planned: week[1],
      userId
    })
    inputs.push({
      name: 'Improve workplace conditions',
      goal: goals[2].id,
      planned: week[1],
      userId
    })
    week.forEach((planned) => {
      inputs.push({
        name: 'Start each morning by writing at least 50 words on one of the subjects',
        goal: goals[3].id,
        planned,
        group_id: '8a0c894da9bd4c9e9f8fb52e28009c6e',
        userId
      })
      inputs.push({
        name: 'Sleep at least 8 hours a day',
        goal: goals[2].id,
        planned,
        group_id: '24a13981b6d24bd58d7b47377eac86df',
        userId
      })
      inputs.push({
        name: 'Take 1 hour every week to plan work and set priorities',
        goal: goals[2].id,
        planned,
        group_id: '2ee226d227ad408d84c842b2108b885b',
        userId
      })
      inputs.push({
        name: 'Take a 5-minute break every hour',
        goal: goals[2].id,
        planned,
        group_id: '1dcdfe3a218d454488f66e6fc7e3adc2',
        userId
      })
      inputs.push({
        name: 'Connect with at least 10 new people every week',
        goal: goals[1].id,
        planned,
        group_id: '1d433518ae714bfc9aef1f0f3b284ba5',
        userId
      })
      inputs.push({
        name: 'Post high-quality content on my social media profile at least once per week',
        goal: goals[1].id,
        planned,
        group_id: '328ce0457f1d496ab8d74130d2b208f3',
        userId
      })
      inputs.push({
        name: "Take 10 minutes every day to comment on the industry's expert's content",
        goal: goals[1].id,
        planned,
        group_id: '92cd9519b8704b12ab2d1612e1364acc',
        userId
      })
      inputs.push({
        name: 'Fill the water bottle in the morning and after lunch and bring to the desk',
        goal: goals[0].id,
        planned,
        group_id: 'b5c82f220ff2497c8c7a1cf71915fa2a',
        userId
      })
      inputs.push({
        name: 'Go for a walk during my lunch break',
        goal: goals[0].id,
        planned,
        group_id: '83dca1edce0e4191b71956433a888ac9',
        userId
      })
      inputs.push({
        name: 'Prepare a bowl of fruits as an evening snack',
        goal: goals[0].id,
        planned,
        group_id: 'ee6fde58d41f444e9c48af8f55381c8d',
        userId
      })
    })
    await task.insert({ inputs })
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
        if (user.username === 'demo') await seed(user.id)
        const token = app.jwt.sign({ id: user.id })
        return { token }
      } else {
        return reply.callNotFound()
      }
    }
  )
}
