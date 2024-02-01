import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prima.service';

export const createSampleData = async (prisma) => {
  const password = await bcrypt.hash('my_secret_password', 12);

  await prisma.cleanDb();

  await prisma.user.upsert({
    where: {
      email: 'client@example.com',
    },
    update: {
      password,
    },
    create: {
      email: 'client@example.com',
      password: password,
    },
  });

  await prisma.user.upsert({
    where: {
      email: 'manager@example.com',
    },
    update: {
      password,
    },
    create: {
      email: 'manager@example.com',
      password: password,
      role: 'MANAGER',
    },
  });

  // Create three active products under the same category
  await prisma.product.create({
    data: {
      name: 'active_product_1',
      price: 99 /* $0.99 */,
      stock: 3,
      category: {
        create: {
          name: 'Sample Category 1',
          slug: 'sample-category-1',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'active_product_2',
      price: 99 /* $0.99 */,
      stock: 5,
      category: {
        connect: {
          slug: 'sample-category-1',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'active_product_3',
      price: 99 /* $0.99 */,
      stock: 1,
      category: {
        connect: {
          slug: 'sample-category-1',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'active_product_4',
      price: 99 /* $0.99 */,
      stock: 1,
      category: {
        connect: {
          slug: 'sample-category-1',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'active_product_5',
      price: 99 /* $0.99 */,
      stock: 1,
      category: {
        connect: {
          slug: 'sample-category-1',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'active_product_6',
      price: 99 /* $0.99 */,
      stock: 1,
      category: {
        create: {
          name: 'Sample Category 2',
          slug: 'sample-category-2',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'disabled_product_1',
      price: 99 /* $0.99 */,
      stock: 3,
      category: {
        connect: {
          slug: 'sample-category-1',
        },
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'deleted_product_1',
      price: 99 /* $0.99 */,
      stock: 0,
      category: {
        connect: {
          slug: 'sample-category-1',
        },
      },
    },
  });
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule).then(
    async (nestApplication) => {
      //
      // Create two test users (client, manager) when the application start if it doesn't exist
      // TODO: Check the environment to only run when running locally or development mode
      //
      const prisma = nestApplication.get(PrismaService);

      await createSampleData(prisma);
      return nestApplication;
    },
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('RAVN')
    .setDescription('ofujimoto@gmail.com')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: '[string] Bearer',
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access_token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
