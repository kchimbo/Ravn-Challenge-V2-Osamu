import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prima.service';
import { OrdersService } from '../orders/services/orders.service';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../prisma/prisma.errors';
import { ProductNotFoundException } from '../products/exceptions/product-not-found.exception';
@Injectable()
export class CartsService {
  private logger = new Logger(CartsService.name);
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prismaService: PrismaService,
  ) {}

  async checkoutCart(userId: number) {
    const cart = await this.getCart(userId);
    await this.ordersService.createOrder(userId, cart);

    await this.deleteCart(userId);
  }
  async deleteCart(userId: number) {
    try {
      await this.prismaService.cart.delete({
        where: {
          userId,
        },
      });
    } catch (err) {
      this.logger.log(`The cart for the ${userId} does not exist`);
    }
    return await this.getOrCreateCart(userId);
  }

  async getCart(userId: number) {
    const cart = await this.prismaService.cart.findUniqueOrThrow({
      where: {
        userId,
      },
      include: {
        cartItem: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          where: {
            product: {
              isDisabled: false,
              deletedAt: null,
            },
          },
        },
      },
    });
    const totalPrice = cart.cartItem
      .map(({ quantity, product }) => {
        return quantity * product.price;
      })
      .reduce((acc, current) => acc + current, 0);

    return { ...cart, totalPrice };
  }

  async getOrCreateCart(userId: number) {
    const cart = await this.prismaService.cart.upsert({
      where: {
        userId: userId,
      },
      update: {},
      create: {
        userId,
      },
      include: {
        cartItem: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          where: {
            product: {
              isDisabled: false,
              deletedAt: null,
            },
          },
        },
      },
    });

    const totalPrice = cart.cartItem
      .map(({ quantity, product }) => {
        return quantity * product.price;
      })
      .reduce((acc, current) => acc + current, 0);

    return { ...cart, totalPrice };
  }

  /**
   * Update the quantity of the items in the current user's cart.
   * It can be used to: add a new product, update the quantity of a product and remove a product from the cart.
   * @param userId the id of the user
   * @param productId the id of the product
   * @param quantity the quantity of the product
   */
  async updateItemCart(userId: number, { products }) {
    // test
    // 1. add a new product to a user without cart
    // 2. update the quantity of existing product in the cart
    // 3. update the quantity of an non-existing product of cart
    // 4. setting the quantity to zero deletes the items from the cart
    // 5. add a non-existant-product
    const { id: cartId } = await this.getOrCreateCart(userId);
    if (products.length == 0) {
      throw new BadRequestException('The cart does not include any products');
    }
    for (const { productId, quantity } of products) {
      if (quantity < 1) {
        try {
          await this.prismaService.cartItem.delete({
            where: {
              cartId_productId: {
                cartId: cartId,
                productId: productId,
              },
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === PrismaError.ModelDoesNotExist
          ) {
            throw new BadRequestException(
              `Unable to update the cart. The product ${productId} does not exists`,
            );
          }
        }
      } else {
        try {
          await this.prismaService.cartItem.upsert({
            where: {
              cartId_productId: {
                cartId,
                productId,
              },
            },
            update: {
              quantity,
            },
            create: {
              cartId,
              productId,
              quantity,
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === PrismaError.ForeignKeyConstraintError
          ) {
            throw new BadRequestException(
              `Unable to update the cart. ${productId} does not exists`,
            );
          }
        }
      }
    }
    return await this.getCart(userId);
  }
}
