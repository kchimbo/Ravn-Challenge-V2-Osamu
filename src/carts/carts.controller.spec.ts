import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { OrdersService } from '../orders/orders.service';
import { CartsService } from './carts.service';

describe('CartsController', () => {
  let controller: CartsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        {
          provide: CartsService,
          useValue: {
            checkoutCart: jest.fn(),
            deleteCart: jest.fn(),
            updateItemCart: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
