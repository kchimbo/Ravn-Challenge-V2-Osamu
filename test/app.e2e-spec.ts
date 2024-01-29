import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { PrismaClientExceptionFilter } from '../src/prisma/prisma-client-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../src/prisma/prima.service';
import { faker } from '@faker-js/faker';

describe('AuthController (e2e)', () => {
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
    prisma.cleanDb();

    await app.init();
    await app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');
    pactum.stash.addDataMap({
      existingEmail: faker.internet.email(),
      existingPassword: faker.internet.password(),
    });

    await pactum.spec().post('/auth/register').withJson({
      email: '$M{existingEmail}',
      password: '$M{existingPassword}',
    });
  });

  afterAll(() => {
    app.close();
  });

  describe('Authentication', () => {
    describe('Login User', () => {
      it('should throw an error if fields are empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: '',
            password: '',
          })
          .expectStatus(400)
          .expectJson('message.field', ['email', 'password']);
      });
      it("should throw an error if email doesn't exists", () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: faker.internet.email(),
            password: faker.internet.password(),
          })
          .expectStatus(401);
      });
      it('should throw an error if password is incorrect', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: '$M{existingEmail}',
            password: faker.internet.password(),
          })
          .expectStatus(401);
      });
      it('should return accessToken and refreshToken if credentials are correct', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: '$M{existingEmail}',
            password: '$M{existingPassword}',
          })
          .expectStatus(200);
      });
    });
    describe('Register User', () => {
      it('should throw an error if fields are empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withJson({
            email: '',
            password: '',
          })
          .expectJson('message.field', ['email', 'password'])
          .expectStatus(400);
      });
      it('should throw an error if email is invalid', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withJson({
            email: 'not_an_email',
            password: faker.internet.password(),
          })
          .expectJson('message.field', ['email'])
          .expectStatus(400);
      });
      it('should throw an error if email already used', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withJson({
            email: '$M{existingEmail}',
            password: faker.internet.password(),
          })
          .expectStatus(409);
      });
      it('should return an empty response if registration was successful', () => {
        // TODO: fix
        return pactum
          .spec()
          .post('/auth/register')
          .withJson({
            email: faker.internet.email(),
            password: faker.internet.password(),
          })
          .expectStatus(201);
      });
    });
  });
});
