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
      existingEmail: credentials.client.email,
      existingPassword: credentials.client.password,
      existingManagerEmail: credentials.manager.email,
      existingManagerPassword: credentials.manager.password,
    });

    await pactum.spec().post('/auth/register').withJson({
      email: '$M{existingEmail}',
      password: '$M{existingPassword}',
    });

    await pactum.spec().post('/auth/register').withJson({
      email: '$M{existingManagerEmail}',
      password: '$M{existingManagerPassword}',
    });

    await prisma.user.update({
      where: {
        email: credentials.manager.email.toLowerCase(),
      },
      data: {
        role: Role.MANAGER,
      },
    });
  });

  afterAll(() => {
    app.close();
  });

  describe('Authentication', () => {
    describe('Permissions', () => {
      it('should throw an error if a guest accesses /me', () => {
        return pactum.spec().get('/auth/me').expectStatus(401);
      });
      it('should throw an error if a guest accesses /manager', () => {
        return pactum.spec().get('/auth/manager').expectStatus(401);
      });
      it('should return information about the user if the user is a client and visits /me', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: '$M{existingEmail}',
          password: `$M{existingPassword}`,
        });

        const accessToken = response.json.accessToken;

        return pactum
          .spec()
          .get('/auth/me')
          .withBearerToken(accessToken)
          .expectStatus(200)
          .expectJsonMatchStrict({
            id: like(1),
            email: credentials.client.email.toLowerCase(),
            role: Role.Client,
          });
      });
      it('should return information about the user if the user is a manager and visits /me', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: '$M{existingManagerEmail}',
          password: `$M{existingManagerPassword}`,
        });

        const accessToken = response.json.accessToken;

        return pactum
          .spec()
          .get('/auth/me')
          .withBearerToken(accessToken)
          .expectStatus(200)
          .expectJsonMatchStrict({
            id: like(1),
            email: credentials.manager.email.toLowerCase(),
            role: Role.MANAGER,
          });
      });
      it('should throw an error if a client accesses /manager', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: '$M{existingEmail}',
          password: `$M{existingPassword}`,
        });

        const accessToken = response.json.accessToken;

        return pactum
          .spec()
          .get('/auth/manager')
          .withBearerToken(accessToken)
          .expectStatus(403);
      });
      it('should return a message if a manager accesses /manager', async () => {
        const response = await pactum.spec().post('/auth/login').withJson({
          email: '$M{existingManagerEmail}',
          password: `$M{existingManagerPassword}`,
        });

        const accessToken = response.json.accessToken;

        return pactum
          .spec()
          .get('/auth/manager')
          .withBearerToken(accessToken)
          .expectStatus(200)
          .expectBody('managers_only');
      });
    });

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
        // TODO: Check for token in the response
        return pactum
          .spec()
          .post('/auth/login')
          .withJson({
            email: '$M{existingEmail}',
            password: '$M{existingPassword}',
          })
          .expectStatus(200)
          .expectJsonMatchStrict({
            accessToken: like(''),
            refreshToken: like(''),
          });
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
