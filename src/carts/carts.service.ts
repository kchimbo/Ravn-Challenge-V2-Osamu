import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prima.service';
import { use } from 'passport';
import { CartDto } from './dto/cart.dto';

@Injectable()
export class CartsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Delete the cart and its associated items when the user completes an order
   * @param userId the id of the user
   */
  async deleteCart(userId: number) {
    // 1. test if deleting the cart also deletes the cart items
    return this.prismaService.cart.delete({
      where: {
        userId,
      },
    });
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
      .map(({ quantity, product }) => quantity * product.price)
      .reduce((acc, current) => acc + current, 0);

    return { ...cart, totalPrice };
  }

  async getOrCreateCart(userId: number) {
    console.log('Cart');
    const { id } = await this.prismaService.cart.upsert({
      where: {
        userId: userId,
      },
      update: {},
      create: {
        userId,
      },
    });
    console.log(id);
    return id;
  }

  /**
   * Update the quantity of the items in the current user's cart.
   * It can be used to: add a new product, update the quantity of a product and remove a product from the cart.
   * @param userId the id of the user
   * @param productId the id of the product
   * @param quantity the quantity of the product
   */
  async updateItemCart(userId: number, productId: number, quantity: number) {
    // test
    // 1. add a new product to a user without cart
    // 2. update the quantity of existing product in the cart
    // 3. update the quantity of an non-existing product of cart
    // 4. setting the quantity to zero deletes the items from the cart
    // 5. add a non-existant-product
    const cartId = await this.getOrCreateCart(userId);
    if (!quantity) {
      /* Avoid an error when the product doesn't exist */
      this.prismaService.cartItem.deleteMany({
        where: {
          cartId,
          productId,
        },
      });
      return null; // return current cart items
    }
    this.prismaService.cartItem.upsert({
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
    return null;
  }
}
