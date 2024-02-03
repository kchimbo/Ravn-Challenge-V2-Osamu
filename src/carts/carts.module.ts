import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { PrismaService } from '../prisma/prima.service';
import { OrdersService } from '../orders/services/orders.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  providers: [OrdersService, CartsService, PrismaService],
  controllers: [CartsController],
  exports: [CartsService],
})
export class CartsModule {}
