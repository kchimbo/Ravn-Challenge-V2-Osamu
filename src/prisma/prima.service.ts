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
    console.log(hashedPassword);
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
