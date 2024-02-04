import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prima.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaError } from '../../prisma/prisma.errors';
import { ProductNotFoundException } from '../../products/exceptions/product-not-found.exception';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: DeepMockProxy<PrismaService>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should throw an error when the user doesn't exist", async () => {
    prismaService.user.findFirstOrThrow.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.ModelDoesNotExist,
        clientVersion: '1',
      });
    });

    await expect(service.getOrderForUser(1)).rejects.toThrow(NotFoundException);
  });

  it("should throw an error when the user doesn't exist", async () => {
    prismaService.user.findFirstOrThrow.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.UniqueConstraintFailed,
        clientVersion: '1',
      });
    });

    await expect(service.getOrderForUser(1)).rejects.toThrow(
      PrismaClientKnownRequestError,
    );
  });

  it("should throw an error when there's not enough available stock", async () => {
    const cart = {
      cartItem: [
        {
          productId: 1,
          quantity: 10,
          product: {
            price: 99,
          },
        },
      ],
    };

    const prismaMock = {
      product: { findMany: jest.fn() },
    };

    jest
      .spyOn(prismaService, '$transaction')
      .mockImplementation((callback) => callback(prismaMock as any));

    prismaMock.product.findMany.mockResolvedValueOnce([
      {
        id: 1,
        stock: 1,
      },
    ]);

    await expect(service.createOrder(1, cart)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw an error when the product was deleted or disabled', async () => {
    const cart = {
      cartItem: [
        {
          productId: 1,
          quantity: 10,
          product: {
            price: 99,
          },
        },
      ],
    };

    const prismaMock = {
      product: { findMany: jest.fn() },
    };

    jest
      .spyOn(prismaService, '$transaction')
      .mockImplementation((callback) => callback(prismaMock as any));

    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await expect(service.createOrder(1, cart)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create a new order and update the stock', async () => {
    const cart = {
      cartItem: [
        {
          productId: 1,
          quantity: 1,
          product: {
            price: 99,
          },
        },
      ],
    };

    const prismaMock = {
      product: { findMany: jest.fn(), update: jest.fn() },
      order: { create: jest.fn() },
    };

    jest
      .spyOn(prismaService, '$transaction')
      .mockImplementation((callback) => callback(prismaMock as any));

    prismaMock.product.findMany.mockResolvedValueOnce([
      {
        id: 1,
        stock: 1,
      },
    ]);

    await expect(service.createOrder(1, cart)).resolves.toBe(undefined);

    expect(prismaMock.order.create).toHaveBeenCalled();
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      data: {
        stock: 0,
      },
      where: {
        id: 1,
      },
    });
  });

  it('should return the orders for the given user', async () => {
    prismaService.order.findMany.mockResolvedValueOnce([
      {
        id: 1,
        userId: 1,
        total: 99,
        createdAt: new Date(),
      },
    ]);

    await expect(service.getOrderForUser(1)).resolves.toStrictEqual([
      {
        id: 1,
        userId: 1,
        total: 99,
        createdAt: expect.any(Date),
      },
    ]);
  });
});
