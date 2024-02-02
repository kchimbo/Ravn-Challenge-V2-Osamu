import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }
  async onModuleInit() {
    await this.$connect();
    this.$use(this.productSoftDeleteMiddleware);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.$on('query', async (e) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log(`${e.query} ${e.params}`);
    });
  }

  async cleanDb() {
    return this.$transaction([
      // Tokens
      this.outstandingToken.deleteMany(),
      // Cart
      this.cartItem.deleteMany(),
      this.cart.deleteMany(),
      // Order Item
      this.orderItem.deleteMany(),
      this.order.deleteMany(),
      // Product
      this.image.deleteMany(),
      this.likesOnProduct.deleteMany(),
      this.product.deleteMany(),
      this.category.deleteMany(),
      // User
      this.user.deleteMany(),
    ]);
  }

  async seedUsers() {
    const hashedPassword = await bcrypt.hash('secret_password', 12);
    await this.$queryRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
    return this.user.createMany({
      data: [
        {
          email: 'client@example.com',
          password: hashedPassword,
        },
        {
          email: 'manager@example.com',
          password: hashedPassword,
          role: Role.MANAGER,
        },
      ],
    });
  }

  /**
   * Seed the client cart <client@example.com> with a single product
   */
  async seedCart() {
    await this.cart.create({
      data: {
        userId: 1,
        cartItem: {
          create: [
            {
              productId: 1,
              quantity: 1,
            },
          ],
        },
      },
    });
  }

  async seedProducts() {
    await this.$queryRaw`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1`;
    await this.product.create({
      data: {
        name: 'active_product_1',
        price: 99 /* $0.99 */,
        stock: 3,
        category: {
          create: {
            name: 'Sample Category 1',
            slug: 'sample-category-1',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'active_product_2',
        price: 99 /* $0.99 */,
        stock: 5,
        category: {
          connect: {
            slug: 'sample-category-1',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'active_product_3',
        price: 99 /* $0.99 */,
        stock: 1,
        category: {
          connect: {
            slug: 'sample-category-1',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'active_product_4',
        price: 99 /* $0.99 */,
        stock: 1,
        category: {
          connect: {
            slug: 'sample-category-1',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'active_product_5',
        price: 99 /* $0.99 */,
        stock: 1,
        category: {
          connect: {
            slug: 'sample-category-1',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'active_product_6',
        price: 99 /* $0.99 */,
        stock: 1,
        category: {
          create: {
            name: 'Sample Category 2',
            slug: 'sample-category-2',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'disabled_product_1',
        price: 99 /* $0.99 */,
        stock: 3,
        isDisabled: true,
        category: {
          connect: {
            slug: 'sample-category-1',
          },
        },
      },
    });

    await this.product.create({
      data: {
        name: 'deleted_product_1',
        price: 99 /* $0.99 */,
        stock: 0,
        deletedAt: new Date(),
        category: {
          connect: {
            slug: 'sample-category-1',
          },
        },
      },
    });
  }

  productSoftDeleteMiddleware: Prisma.Middleware = async (params, next) => {
    if (params.model !== 'Product') {
      return next(params);
    }
    if (params.action == 'delete') {
      return next({
        ...params,
        action: 'update',
        args: {
          ...params.args,
          data: {
            deletedAt: new Date(),
          },
        },
      });
    }
    return next(params);
  };
}
