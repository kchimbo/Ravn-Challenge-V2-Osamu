import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prima.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: number, cart: any) {
    const orderItems = cart.cartItem.map(
      ({ productId, quantity, product: { price } }) => {
        return { userId, productId, quantity, price };
      },
    );
    await this.prismaService.order.create({
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
