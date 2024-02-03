import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prima.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: number, cart: any) {
    console.log('Creating the order for cart...');
    console.log(cart);
    // Check if we have enough stock of each cartItem
    const orderItems = cart.cartItem.map(
      ({ productId, quantity, product: { price } }) => {
        return { userId, productId, quantity, price };
      },
    );

    await this.prismaService.$transaction(async (tx) => {
      const items = cart.cartItem.map(
        ({ productId, product: { price }, quantity }) => {
          return { userId, productId, price, quantity };
        },
      );
      // Find the current stock for the items in the cart
      const result = await tx.product.findMany({
        where: {
          id: {
            in: items.map(({ productId }) => productId),
          },
        },
        select: {
          id: true,
          stock: true,
        },
      });
      // Check if we have enough stock the items in the cart and get the new quantity to update the product stock
      // after creating the order
      const updatedQuantity = cart.cartItem.map(({ productId, quantity }) => {
        const { stock } = result.find(({ id }) => id === productId) || {};
        if (stock == undefined || stock < quantity) {
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
              data: orderItems,
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
    });
  }

  async getOrderForUser(userId: number) {
    const orders = await this.prismaService.order.findMany({
      where: {
        userId,
      },
      include: {
        orderItem: true,
      },
    });
    if (!orders.length) {
      return {
        data: [],
      };
    }
    return orders;
  }
}
