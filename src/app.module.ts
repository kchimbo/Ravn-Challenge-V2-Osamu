import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import configuration from './configuration';
import { JwtStrategy } from './auth/jwt.strategy';
import { ProductsModule } from './products/products.module';
import { AwsModule } from './aws/aws.module';
import { OrdersModule } from './orders/orders.module';
import { CartsModule } from './carts/carts.module';
import { BullModule } from '@nestjs/bull';
import { EmailsService } from './emails/services/emails.service';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    EmailsModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    AwsModule,
    CartsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, EmailsService],
})
export class AppModule {}
