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
    await prisma.cleanDb();
    await prisma.seedUsers();
    await prisma.seedProducts();
    await prisma.seedCart();

    await app.init();
    await app.listen(3000);

    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(() => {
    app.close();
  });

  describe('Retrieve order', () => {});
});
