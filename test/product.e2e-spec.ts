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
import { createSampleData } from '../src/main';

const credentials = {
  client: {
    email: faker.internet.email(),
    password: faker.internet.password(),
  },
  manager: {
    email: faker.internet.email(),
    password: faker.internet.password(),
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
    await createSampleData(prisma);

    await app.init();
    await app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');

    pactum.stash.addDataMap({
      existingEmail: credentials.client.email,
      existingPassword: credentials.client.password,
      existingManagerEmail: credentials.manager.email,
      existingManagerPassword: credentials.manager.password,
      inStockObject: 1,
      deletedObject: 2,
      disabledObject: 3,
    });
  });

  afterAll(() => {
    app.close();
  });

  describe('ProductController', () => {
    describe('List products', () => {
      it("doesn't return deleted or disabled products", async () => {
        const r = await pactum
          .spec()
          .get('/products')
          .expectStatus(200)
          .expectJsonLength(1)
          .toss();
        console.log(r);
      });
    });
    describe('Get product details', () => {
      it('returns an active product', async () => {
        await pactum
          .spec()
          .get(`/products/$M{inStockObject.id}`)
          .expectStatus(200);
      });
      it('throws an error when the product was deleted', async () => {
        await pactum
          .spec()
          .get(`/products/$M{deletedObject.id}`)
          .expectStatus(404);
      });
      it('throws an error when the product was disabled', async () => {
        await pactum
          .spec()
          .get(`/products/$M{disabledObject.id}`)
          .expectStatus(404);
      });
    });
    describe('Like product', () => {
      it('throws an error when the user liking the product is a guest', async () => {
        await pactum
          .spec()
          .post(`/products/$M{inStockObject.id}/like`)
          .expectStatus(401);
      });

      it('succeeds when liking a new product for the first time', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: '$M{existingEmail}',
          password: `$M{existingPassword}`,
        });

        await pactum
          .spec()
          .post(`/products/$M{inStockObject.id}/like`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(201);
      });
      it('throws an error when the product liked was deleted', () => {
        // TODO: implement
      });
      it('throws an error when the product liked was disabled', () => {
        // TODO: implement
      });
      it('throws an error when the product was already liked', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: '$M{existingEmail}',
          password: `$M{existingPassword}`,
        });

        await pactum
          .spec()
          .post(`/products/$M{inStockObject.id}/like`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(400)
          .expectJsonMatch({
            message: `Product ID:$M{inStockObject.id} was already liked by the user`,
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
          email: '$M{existingEmail}',
          password: `$M{existingPassword}`,
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
