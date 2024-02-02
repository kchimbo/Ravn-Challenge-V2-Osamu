import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { PrismaClientExceptionFilter } from '../src/prisma/prisma-client-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prima.service';
import { faker } from '@faker-js/faker';

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

describe('ProductController (e2e)', () => {
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

    await app.init();
    await app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(() => {
    app.close();
  });

  describe('ProductController', () => {
    describe('List products', () => {
      it("doesn't return deleted or disabled products", async () => {
        return pactum
          .spec()
          .get('/products')
          .expectStatus(200)
          .expectJsonLength(5);
      });
    });
    describe('Get product details', () => {
      it('returns an active product', async () => {
        await pactum.spec().get(`/products/1`).expectStatus(200);
      });
      it('throws an error when the product was deleted', async () => {
        await pactum.spec().get(`/products/8`).expectStatus(404);
      });
      it('throws an error when the product was disabled', async () => {
        await pactum.spec().get(`/products/7`).expectStatus(404);
      });
    });
    describe('Like product', () => {
      it('throws an error when the user liking the product is a guest', async () => {
        await pactum.spec().post(`/products/1/like`).expectStatus(401);
      });

      it('succeeds when liking a new product for the first time', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .post(`/products/1/like`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(201);
      });
      it('throws an error when the product liked was deleted', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .post(`/products/8/like`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(404);
      });
      it('throws an error when the product liked was disabled', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .post(`/products/7/like`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(404);
      });
      it('throws an error when the product was already liked', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .post(`/products/1/like`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(400)
          .expectJsonMatch({
            message: `Product ID:1 was already liked by the user`,
          });
      });
    });
    describe('Delete product', () => {
      it('throws an error when the user is a guest', async () => {
        await pactum
          .spec()
          .delete(`/products/$M{inStockObject.id}`)
          .expectStatus(401);
      });
      it('throws an error when the user is a client', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .delete(`/products/$M{inStockObject.id}`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(403);
      });
      it('succeeds when the product is active', async () => {
        // TODO: implement
      });
    });
  });
});
