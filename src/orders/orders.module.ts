import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartsService } from '../carts/carts.service';
import { PrismaService } from '../prisma/prima.service';

@Module({
  providers: [OrdersService, PrismaService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
