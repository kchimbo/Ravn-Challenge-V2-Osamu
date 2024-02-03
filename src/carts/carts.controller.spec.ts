import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { OrdersService } from '../orders/services/orders.service';
import { CartsService } from './carts.service';

describe('CartsController', () => {
  let controller: CartsController;
  let cartsService: CartsService;

  const cart = {
    userId: 1,
    products: [
      {
        productId: 1,
        quantity: 1,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        {
          provide: CartsService,
          useValue: {
            checkoutCart: jest.fn(),
            deleteCart: jest.fn(),
            getCart: jest.fn(),
            updateItemCart: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    cartsService = module.get<CartsService>(CartsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('checkoutCart should call cartsService.checkoutCart', async () => {
    await controller.checkoutCart(cart.userId);
    expect(cartsService.checkoutCart).toHaveBeenCalled();
  });

  it('updateCart should call cartsService.updateItemCart', async () => {
    await controller.updateCart(cart.userId, { products: cart.products });
    expect(cartsService.updateItemCart).toHaveBeenCalled();
  });

  it('getCart should call cartsService.getCart', async () => {
    await controller.getCart(cart.userId);
    expect(cartsService.getCart).toHaveBeenCalled();
  });

  it('deleteCart should call cartsService.deleteCart', async () => {
    await controller.deleteCart(cart.userId);
    expect(cartsService.deleteCart).toHaveBeenCalled();
  });
});
