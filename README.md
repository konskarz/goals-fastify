# goals-fastify

Fastify-Backend for [lifetrackerbuddy.com](https://lifetrackerbuddy.com/), - an application to manage [OKRs](https://wikipedia.org/wiki/Objectives_and_Key_Results). It is an advanced task manager with main focus on the goal, goal achievement and it's current progress. It should answer the question: _"How far am I away from achieving my goals?"_

## Vue-Frontend

See [Vue-Frontend for lifetrackerbuddy.com](https://github.com/konskarz/goals-vue)

## Run

- Install [PostgreSQL](https://www.postgresql.org/download/)
- Create a new Database
- Create `.env` & `.postgratorrc.json` to store sensitive configuration values

```
npm i
npx postgrator
npm run dev
```

## Deploy DB

- Log in to [Neon](https://neon.tech/) account
- Set up a new project
- Create a new Database
- Add tables using the Neon SQL Editor

## Deploy API

- Log in to [Vercel](https://vercel.com/) account
- Set up a new project
- Import Git Repository
- Set Environment Variables
