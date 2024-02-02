import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { PrismaClientExceptionFilter } from '../src/prisma/prisma-client-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prima.service';
import { faker } from '@faker-js/faker';
const FormData = require('form-data-lite');
const path = require('path');
import * as fs from 'fs';

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
        await pactum.spec().delete(`/products/1`).expectStatus(401);
      });
      it('throws an error when the user is a client', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .delete(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(403);
      });
      it('succeeds when the product is active', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .delete('/products/5')
          .withBearerToken(response.json.accessToken)
          .expectStatus(200);
      });
    });

    describe('Update product details', () => {
      it('throws an error if a user tries to update a product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .put(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(403);
      });
      it('can update the name of the product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .put(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .withJson({
            name: 'new name for the product',
          })
          .expectStatus(200)
          .expectJsonMatch({
            name: 'new name for the product',
          });
      });
      it('can update the description of the product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .put(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .withJson({
            name: 'new description for the product',
          })
          .expectStatus(200)
          .expectJsonMatch({
            name: 'new description for the product',
          });
      });
      it('can update the price of the product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .put(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .withJson({
            price: 999,
          })
          .expectStatus(200)
          .expectJsonMatch({
            price: 999,
          });
      });
      it('can update the stock of the product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .put(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .withJson({
            stock: 10,
          })
          .expectStatus(200)
          .expectJsonMatch({
            stock: 10,
          });
      });
      it('can update the status of the product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .put(`/products/1`)
          .withBearerToken(response.json.accessToken)
          .withJson({
            isDisabled: true,
          })
          .expectStatus(200)
          .expectJsonMatch({
            isDisabled: true,
          });
      });
    });
    describe('Add Image', () => {
      it('add a single image to a product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        const form = new FormData();
        form.append(
          'files',
          fs.readFileSync(path.resolve(__dirname, './input.txt')),
          {
            filename: 'a.txt',
          },
        );

        await pactum
          .spec()
          .post(`/products/1/images`)
          .withBearerToken(response.json.accessToken)
          .withMultiPartFormData(form)
          .expectStatus(201);
      });

      it('add multiple images to a product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        const form = new FormData();
        form.append(
          'files',
          fs.readFileSync(path.resolve(__dirname, './input1.txt')),
          {
            filename: 'input1.txt',
          },
        );
        form.append(
          'files',
          fs.readFileSync(path.resolve(__dirname, './input2.txt')),
          {
            filename: 'input2.txt',
          },
        );

        await pactum
          .spec()
          .post(`/products/2/images`)
          .withBearerToken(response.json.accessToken)
          .withMultiPartFormData(form)
          .expectStatus(201);
      });
    });
    describe('Remove Image', () => {
      it('deletes an image from a product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        // TODO: finish
      });
    });
  });
});
