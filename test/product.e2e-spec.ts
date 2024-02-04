import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { PrismaClientExceptionFilter } from '../src/prisma/prisma-client-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prima.service';
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
      it('should return the first five active products with the default parameters', async () => {
        return pactum
          .spec()
          .get('/products')
          .expectStatus(200)
          .expectJsonLength(5);
      });
      it('should only return 2 active products when setting the limit to 2', async () => {
        return pactum
          .spec()
          .get('/products?limit=2')
          .expectStatus(200)
          .expectJsonLength(2);
      });
      it('should return the next five products when the setting the cursor to 5', async () => {
        return pactum
          .spec()
          .get('/products?cursor=5')
          .expectStatus(200)
          .expectJsonLength(1);
      });
      it('should return the next two products when setting the limit and cursor to 2', async () => {
        return pactum
          .spec()
          .get('/products?limit=2&cursor=2')
          .expectStatus(200)
          .expectJsonLength(2);
      });
      it("shouldn't return disabled or deleted products", async () => {
        return pactum
          .spec()
          .get('/products?cursor=6')
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
    describe('Search products', () => {
      it('should search a product under a category', async () => {
        return pactum
          .spec()
          .get('/products/search?q=product&category=2')
          .expectStatus(200)
          .expectJsonLength(1);
      });
      it("should return any result if the category doesn't exist", async () => {
        return pactum
          .spec()
          .get('/products/search?q=product&category=999')
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
    describe('Get product details', () => {
      it('should return the details of the product', async () => {
        await pactum.spec().get(`/products/1`).expectStatus(200);
      });
      it('should throw an error when the product was deleted', async () => {
        await pactum.spec().get(`/products/8`).expectStatus(404);
      });
      it('should throw an error when the product was disabled', async () => {
        await pactum.spec().get(`/products/7`).expectStatus(404);
      });
      it("should throw an error when the product doesn't exist", async () => {
        await pactum.spec().get(`/products/100`).expectStatus(404);
      });
    });
    describe('Like product', () => {
      it('should throw an error when the user liking the product is a guest', async () => {
        await pactum.spec().post(`/products/1/like`).expectStatus(401);
      });

      it('should succeed when the product is liked for the first time', async () => {
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
      it('should throw an error when the product liked was deleted', async () => {
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
      it('should throw an error when the product liked was disabled', async () => {
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
      it('should throw an error when the product was already liked', async () => {
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
      it('should throw an error when the user is a guest', async () => {
        await pactum.spec().delete(`/products/1`).expectStatus(401);
      });
      it('should throw an error when the user is a client', async () => {
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
      it('should succeed when the product is active', async () => {
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
      it('should throw an error if a guest tries to update a product', async () => {
        await pactum.spec().put(`/products/1`).expectStatus(401);
      });
      it('should an error if a client tries to update a product', async () => {
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
      it("should throw an error if the product doesn't exist", async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .put(`/products/100`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(404);
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
      it('should add a single image to a product', async () => {
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

      it('should add multiple images to a product', async () => {
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
    describe('Create Product', () => {
      it('should throw an error if a guest tries to create a product', async () => {
        await pactum.spec().post(`/products`).expectStatus(401);
      });
      it('should throw an error if a client tries to create a product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .post(`/products`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(403);
      });
      it('should create a new product', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });
        const accessToken = response.json.accessToken;
        const form = new FormData();
        form.append('name', 'creating a new product');
        form.append('price', 1234);
        form.append('category', 'sample-category-1');
        form.append('stock', 100);
        await pactum
          .spec()
          .post('/products')
          .withBearerToken(accessToken)
          .withMultiPartFormData(form)
          .expectStatus(201);
      });
      it('should throw an error if required fields are missing', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });
        const accessToken = response.json.accessToken;
        const form = new FormData();
        await pactum
          .spec()
          .post('/products')
          .withBearerToken(accessToken)
          .withMultiPartFormData(form)
          .expectStatus(400);
      });
    });
    describe('Remove(s) Image', () => {
      it('should throw an error if a guest tries to remove an image', async () => {
        await pactum.spec().post(`/products`).expectStatus(401);
      });
      it('should throw an error if a client tries to remove an image', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.client.email,
          password: credentials.client.password,
        });

        await pactum
          .spec()
          .delete(`/products/images/1234`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(403);
      });
      it("should throw an error if the image doesn't exist", async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });

        await pactum
          .spec()
          .delete(`/products/images/1234`)
          .withBearerToken(response.json.accessToken)
          .expectStatus(404);
      });
      it('should delete an image from a product', async () => {
        const login = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });
        const accessToken = login.json.accessToken;

        const form = new FormData();
        form.append('name', 'remove a single image');
        form.append('price', 1234);
        form.append('category', 'sample-category-1');
        form.append('stock', 100);
        form.append(
          'files',
          fs.readFileSync(path.resolve(__dirname, './input1.txt')),
          {
            filename: 'input1.txt',
          },
        );

        const response = await pactum
          .spec()
          .post('/products')
          .withBearerToken(accessToken)
          .withMultiPartFormData(form);

        const [imageId] = response.json.Image.map(({ id }) => id);

        return pactum
          .spec()
          .delete(`/products/images/${imageId}`)
          .withBearerToken(accessToken)
          .expectStatus(200);
      });
      it('should delete all images from a product', async () => {
        const login = await pactum.spec().post('/auth/login').withJson({
          email: credentials.manager.email,
          password: credentials.manager.password,
        });
        const accessToken = login.json.accessToken;

        const form = new FormData();
        form.append('name', 'remove all images');
        form.append('price', 1234);
        form.append('category', 'sample-category-1');
        form.append('stock', 100);
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

        const response = await pactum
          .spec()
          .post('/products')
          .withBearerToken(accessToken)
          .withMultiPartFormData(form);

        return pactum
          .spec()
          .delete(`/products/${response.json.id}/images`)
          .withBearerToken(accessToken)
          .expectStatus(200);
      });
    });
  });
});
