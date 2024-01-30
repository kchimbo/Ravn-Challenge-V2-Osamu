import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { PrismaService } from '../prisma/prima.service';

@Module({
  providers: [ProductsService, PrismaService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
