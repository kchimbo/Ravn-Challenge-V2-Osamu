import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { PrismaService } from '../prisma/prima.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { OrdersService } from '../orders/services/orders.service';
import { BadRequestException } from '@nestjs/common';

describe('CartsService', () => {
  let service: CartsService;
  let ordersService: OrdersService;
  let prisma: DeepMockProxy<PrismaService>;

  const emptyCart = {
    id: 2,
    userId: 2,
    createdAt: new Date(),
    updatedAt: null,
    cartItem: [],
  };

  const dbCart = {
    id: 2,
    userId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    cartItem: [
      {
        cartId: 2,
        productId: 1,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 1,
          name: 'sample-product',
          description: null,
          price: 99,
          stock: 2,
          categoryId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isDisabled: false,
          category: {
            id: 1,
            name: 'Sample Category',
            slug: 'sample-category',
          },
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        PrismaService,
        {
          provide: OrdersService,
          useValue: {
            createOrder: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<CartsService>(CartsService);
    ordersService = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the cart with the total price', async () => {
    prisma.cart.findUniqueOrThrow.mockResolvedValueOnce(dbCart);

    await expect(service.getCart(dbCart.id)).resolves.toStrictEqual({
      ...dbCart,
      totalPrice: 198,
    });
  });

  it('checking out a cart should call createOrder', async () => {
    prisma.cart.delete.mockResolvedValueOnce(emptyCart);
    prisma.cart.upsert.mockResolvedValueOnce({
      id: 2,
      userId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      cartItem: [],
    } as any);
    prisma.cart.findUniqueOrThrow.mockResolvedValueOnce(dbCart);

    await service.checkoutCart(dbCart.userId);

    expect(ordersService.createOrder).toHaveBeenCalledWith(dbCart.userId, {
      ...dbCart,
      totalPrice: 198,
    });
  });

  it('should delete the cart', async () => {
    prisma.cart.delete.mockResolvedValueOnce(emptyCart);
    prisma.cart.upsert.mockResolvedValueOnce({
      id: 2,
      userId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      cartItem: [],
    } as any);

    await expect(service.deleteCart(emptyCart.userId)).resolves.toStrictEqual({
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      cartItem: [],
      id: 2,
      totalPrice: 0,
      userId: 2,
    });
  });

  it('should not update the cart if the list of products is empty', async () => {
    prisma.cart.upsert.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      cartItem: [],
    } as any);

    await expect(service.updateItemCart(1, { products: [] })).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
  });

  it('should remove an item from the cart if the quantity is zero', async () => {
    prisma.cart.upsert.mockResolvedValue(emptyCart);
    prisma.cart.findUniqueOrThrow.mockResolvedValueOnce(dbCart);

    await service.updateItemCart(1, {
      products: [
        {
          productId: 1,
          quantity: 0,
        },
      ],
    });

    expect(prisma.cartItem.delete).toHaveBeenCalled();
    expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
  });

  it('should add/update an item from the cart if the quantity is not zero', async () => {
    prisma.cart.upsert.mockResolvedValue(emptyCart);
    prisma.cart.findUniqueOrThrow.mockResolvedValueOnce(dbCart);

    await service.updateItemCart(1, {
      products: [
        {
          productId: 1,
          quantity: 1,
        },
      ],
    });

    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.cartItem.upsert).toHaveBeenCalled();
  });
});
