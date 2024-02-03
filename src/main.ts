import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prima.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule).then(
    async (nestApplication) => {
      //
      // Create two test users (client, manager) when the application start if it doesn't exist
      // TODO: Check the environment to only run when running locally or development mode
      //
      const prisma = nestApplication.get(PrismaService);

      await prisma.cleanDb();
      await prisma.seedUsers();
      await prisma.seedProducts();
      await prisma.seedCart();
      await prisma.seedOrder();
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
