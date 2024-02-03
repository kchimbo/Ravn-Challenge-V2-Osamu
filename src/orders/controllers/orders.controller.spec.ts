import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { AuthService } from '../../auth/services/auth.service';
import { OrdersService } from '../services/orders.service';
import { CartsService } from '../../carts/carts.service';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Order, OrderItem, Product } from '@prisma/client';
describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: OrdersService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        ClassSerializerInterceptor,
        {
          provide: OrdersService,
          useValue: {
            getOrderForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
