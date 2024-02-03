import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { PrismaClientExceptionFilter } from '../src/prisma/prisma-client-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prima.service';
import { faker } from '@faker-js/faker';
import { like } from 'pactum-matchers';
import { Role } from '../src/auth/types/roles.enum';
import { canReferenceNode } from '@nestjs/swagger/dist/plugin/utils/plugin-utils';

const credentials = {
  client: {
    email: 'client@example.com',
    password: 'secret_password',
  },
  manager: {
    email: 'manager@example.com',
    password: 'secret_password',
  },
};

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let prisma;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add the exiting filter from main.ts
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    await prisma.seedUsers();
    await prisma.seedProducts();
    await prisma.seedOrder();

    await app.init();
    await app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(() => {
    app.close();
  });

  describe('Retrieve orders (/orders)', () => {
    it('throws an error when the user is a guest and visits /orders', async () => {
      await pactum.spec().get(`/orders`).expectStatus(401);
    });
    it("returns an empty list when the user doesn't have any orders", async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.manager.email,
        password: credentials.manager.password,
      });

      await pactum
        .spec()
        .get(`/orders`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(200)
        .expectJsonMatchStrict([])
        .expectJsonLength(0);
    });
    it('returns a list of orders when the user has at least one order', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .get(`/orders`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(200)
        .expectJsonLength(1);
    });
  });
  describe('Retrieve orders (/orders/:id)', () => {
    it('throws an error when the user is a guest and visits /orders/:id', async () => {
      await pactum.spec().get(`/orders/1`).expectStatus(401);
    });
    it('throws an error when the user is a client visits /orders/:id', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .get(`/orders/1`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(403);
    });
    it("returns an empty list when a manager visits /orders/:id and the user doesn't have any order", async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.manager.email,
        password: credentials.manager.password,
      });

      await pactum
        .spec()
        .get(`/orders/5`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(200)
        .expectJsonMatchStrict([])
        .expectJsonLength(0);
    });
    it('returns a list of orders when a manager visits /orders/:id and the user have at least one order', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.manager.email,
        password: credentials.manager.password,
      });

      await pactum
        .spec()
        .get(`/orders/1`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it("throws a error when the user doesn't exists", async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.manager.email,
        password: credentials.manager.password,
      });

      await pactum
        .spec()
        .get(`/orders/999`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(404);
    });
  });
});
