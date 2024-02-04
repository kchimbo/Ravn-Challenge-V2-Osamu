# Tiny Store

## Setup

1. Use the `docker-compose.yaml` file to set up the necessary application dependencies
postgres, redis and mailpit

2. Install the project dependencies using `npm install`

3. Rename `.env.sample` to `env` and configure the environment variables

4. Run `npx prisma db push` to create the database schema using Prisma

5. Start the application with `npm run start:dev`

The database is resetted everytime the application is restarted. Uncomment the following lines in `main.ts` to disable 
the behaviour:

```typescript
await prisma.cleanDb();
await prisma.seedUsers();
await prisma.seedProducts();
await prisma.seedCart();
await prisma.seedOrder();
```

## Email

This application uses [mailpit](https://github.com/axllent/mailpit) to "mock" the email provider.

Visit http://localhost8025 to see the emails that are "received" by the application's users

## Tests

- Run tests with `npm run test`
- Run E2E tests with `npm run test:e2e -- --maxWorkers=1`

## API

See the available endpoints by visting http://localhost:3000/api

