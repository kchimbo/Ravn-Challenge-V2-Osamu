import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    this.$use(this.productSoftDeleteMiddleware);
  }

  cleanDb() {
    return this.$transaction([this.user.deleteMany()]);
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
