import {
  BadRequestException,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../../prisma/prisma.errors';

@Injectable()
export class OrdersService {
  private logger: LoggerService = new Logger(OrdersService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: number, cart: any) {
    await this.prismaService.$transaction(async (tx) => {
      const items = cart.cartItem.map(
        ({ productId, product: { price }, quantity }) => {
          return { userId, productId, price, quantity };
        },
      );
      // Find the current stock for the items in the cart and check that all the products in the cart are not disabled
      // or deleted
      const result = await tx.product.findMany({
        where: {
          id: {
            in: items.map(({ productId }) => productId),
          },
          isDisabled: false,
          deletedAt: null,
        },
        select: {
          id: true,
          stock: true,
        },
      });
      if (result.length != items.length) {
        throw new BadRequestException(
          'Unable to create order from cart. One or more products are no longer ' +
            'available',
        );
      }

      // Check if we have enough stock the items in the cart and get the new quantity to update the product stock
      // after creating the order
      const updatedQuantity = cart.cartItem.map(({ productId, quantity }) => {
        const { stock } = result.find(({ id }) => id === productId) || {};
        if (stock == undefined || stock < quantity) {
          this.logger
            .error(`Unable to create order from cart. Not enough stock (required ${quantity}, ${stock} available) for 
            product ${productId}`);
          throw new BadRequestException(
            `Not enough stock for product ${productId}`,
          );
        } else {
          return { productId, quantity: stock - quantity };
        }
      });
      // Create the order
      await tx.order.create({
        data: {
          userId: userId,
          total: cart.totalPrice,
          orderItem: {
            createMany: {
              data: items,
            },
          },
        },
      });
      // Update the stock
      await Promise.all(
        updatedQuantity.map(async ({ productId, quantity }) => {
          await tx.product.update({
            where: {
              id: productId,
            },
            data: {
              stock: quantity,
            },
          });
        }),
      );
      return null;
    });
  }

  async getOrderForUser(userId: number) {
    try {
      await this.prismaService.user.findFirstOrThrow({
        where: {
          id: userId,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PrismaError.ModelDoesNotExist
      ) {
        throw new NotFoundException(`${userId} does not exists.`);
      }
      throw err;
    }
    const orders = await this.prismaService.order.findMany({
      where: {
        userId,
      },
      include: {
        orderItem: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Found orders for user ${userId}`);
    this.logger.log(orders);
    return orders;
  }
}
