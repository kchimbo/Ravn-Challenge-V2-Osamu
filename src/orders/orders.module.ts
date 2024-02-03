import { Module } from '@nestjs/common';
import { OrdersService } from './services/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { CartsService } from '../carts/carts.service';
import { PrismaService } from '../prisma/prima.service';

@Module({
  providers: [OrdersService, PrismaService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
