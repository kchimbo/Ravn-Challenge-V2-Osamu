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

describe('CartController (e2e)', () => {
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

  beforeEach(async () => {
    await prisma.cart.deleteMany();
  });

  afterAll(() => {
    app.close();
  });

  describe('GET /cart - Retrieve cart', () => {
    it('throws an error when the user is a guest and visits /cart', async () => {
      await pactum.spec().get(`/carts`).expectStatus(401);
    });
    it("should return an empty cart if the user didn't add any items", async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .get(`/carts`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(200)
        .expectJsonMatch({
          cartItem: [],
          totalPrice: 0,
        });
    });
    it('should return the cart with the items', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .patch('/carts')
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 1,
              quantity: 2,
            },
          ],
        });

      await pactum
        .spec()
        .get(`/carts`)
        .withBearerToken(response.json.accessToken)
        .expectStatus(200)
        .expectJsonMatch({
          cartItem: [
            {
              productId: 1,
              quantity: 2,
            },
          ],
          totalPrice: 198,
        });
    });
  });

  describe('DELETE /cart - Delete cart', () => {
    it('throws an error when the user is a guest and visits /cart', async () => {
      await pactum.spec().delete(`/carts`).expectStatus(401);
    });
    it('should clear the cart and create a new cart if the cart is empty', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .delete('/carts')
        .withBearerToken(response.json.accessToken)
        .expectStatus(200);
    });
    it('should clear the cart and create a new cart if the cart is not empty', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 2,
              quantity: 1,
            },
          ],
        });

      await pactum
        .spec()
        .delete('/carts')
        .withBearerToken(response.json.accessToken)
        .expectStatus(200);
    });
  });

  describe('PATCH /cart - Update cart', () => {
    it('throws an error when the user is a guest and visits /cart', async () => {
      await pactum.spec().patch(`/carts`).expectStatus(401);
    });
    it('should add a new item when the item is not in the cart', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 2,
              quantity: 1,
            },
          ],
        })
        .expectStatus(200)
        .expectJsonMatch({
          cartItem: [
            {
              productId: 2,
              quantity: 1,
            },
          ],
          totalPrice: 99,
        });
    });
    it('should update the item quantity when the item already exist in the cart', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 2,
              quantity: 1,
            },
          ],
        });

      await pactum
        .spec()
        .patch('/carts')
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 2,
              quantity: 2,
            },
          ],
        })
        .expectStatus(200)
        .expectJsonMatch({
          cartItem: [
            {
              productId: 2,
              quantity: 2,
            },
          ],
          totalPrice: 198,
        });
    });
    it("should throw a error when deleting a item that doesn't exist", async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 999,
              quantity: 1,
            },
          ],
        })
        .expectStatus(400)
        .expectJsonMatch({
          message: 'Unable to update the cart. 999 does not exists',
        });
    });
    it("should throw a error when updating a item that doesn't exist", async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 999,
              quantity: 1,
            },
          ],
        })
        .expectStatus(400)
        .expectJsonMatch({
          message: 'Unable to update the cart. 999 does not exists',
        });
    });
  });

  describe('POST /cart - Checkout cart', () => {
    it('throws an error when the user is a guest and visits /cart', async () => {
      await pactum.spec().post(`/carts`).expectStatus(401);
    });

    it('throws an error when there is not enough available stock for a product', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      // Add an item to the cart
      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 2,
              quantity: 100,
            },
          ],
        });

      await pactum
        .spec()
        .post('/carts')
        .withBearerToken(response.json.accessToken)
        .expectStatus(400)
        .expectJsonMatch({
          message: `Not enough stock for product 2`,
        });
    });
    it('throws an error when a product is not available', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      // Add an item to the cart
      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 7,
              quantity: 1,
            },
          ],
        });

      const r = await pactum
        .spec()
        .get('/carts')
        .withBearerToken(response.json.accessToken)
        .toss();

      await pactum
        .spec()
        .post('/carts')
        .withBearerToken(response.json.accessToken)
        .expectStatus(400)
        .expectJsonMatch({
          message: `Unable to create order from cart. One or more products are no longer available`,
        });
    });
    it('should create a new order based on the content of the cart', async () => {
      const response = await pactum.spec().post('/auth/login').withJson({
        email: credentials.client.email,
        password: credentials.client.password,
      });

      // Add an item to the cart
      await pactum
        .spec()
        .patch(`/carts`)
        .withBearerToken(response.json.accessToken)
        .withJson({
          products: [
            {
              productId: 2,
              quantity: 1,
            },
          ],
        });

      await pactum
        .spec()
        .post('/carts')
        .withBearerToken(response.json.accessToken)
        .expectStatus(201);

      await pactum
        .spec()
        .get('/carts')
        .withBearerToken(response.json.accessToken)
        .expectJsonMatch({});
    });
  });
});
