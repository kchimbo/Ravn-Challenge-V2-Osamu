import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { Prisma } from '@prisma/client';
import { ProductAlreadyLiked } from '../exceptions/product-already-liked';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { PrismaError } from '../../prisma/prisma.errors';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { AwsService } from '../../aws/aws.service';
import { v4 as uuidv4 } from 'uuid';
import { forkJoin, map, mergeMap, of, reduce, switchMap } from 'rxjs';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private aws: AwsService,
  ) {}

  async listProduct(offset: number, limit: number) {
    return this.prisma.product.findMany({
      take: limit,
      skip: offset,
      where: {
        isDisabled: false,
        deletedAt: null,
      },
    });
  }

  async getProductDetails(productId: number) {
    try {
      return await this.prisma.product.findUniqueOrThrow({
        where: {
          id: productId,
          isDisabled: false,
          deletedAt: null,
        },
      });
    } catch (err) {
      this.handleNotFoundException(err, productId);
    }
  }

  async getProductsByCategory(productName: string, category?: string) {
    return this.prisma.product.findMany({
      where: {
        name: productName,
        isDisabled: false,
        deletedAt: null,
        category: {
          slug: category,
        },
      },
    });
  }

  async createProduct() {
    return 'create_product';
  }

  async updateProduct(productId: number, details: ProductDetailsDto) {
    try {
      return await this.prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          ...details,
        },
      });
    } catch (err) {
      this.handleNotFoundException(err, productId);
    }
  }

  async addImagesToProduct(
    productId: number,
    files: Array<Express.Multer.File>,
  ) {
    return of(...files).pipe(
      mergeMap((file) => this.uploadFile(file)),
      reduce(
        (acc, i) => [
          ...acc,
          { url: i.Location, filename: i.Key, productId: productId },
        ],
        [],
      ),
      map(async (data) => {
        const result = await this.prisma.image.createMany({
          data,
        });
        console.log(result);
        return result;
      }),
    );
  }

  async removeImagesFromProduct(productId: number) {
    const productImage = await this.prisma.image.findMany({
      where: {
        productId: productId,
      },
      select: {
        id: true,
        filename: true,
      },
    });
    return of(...productImage).pipe(
      mergeMap(({ id, filename }) =>
        forkJoin([of(id), this.aws.deleteFile(filename)]),
      ),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reduce((acc, [id, _]) => [...acc, id], []),
      switchMap(async (result) =>
        this.prisma.image.deleteMany({
          where: {
            id: {
              in: result,
            },
          },
        }),
      ),
    );
  }

  async removeImageFromProduct(imageId: number) {
    return 'remove image';
  }

  async deleteProduct(productId: number) {
    try {
      return await this.prisma.product.delete({
        where: {
          id: productId,
        },
      });
    } catch (err) {
      this.handleNotFoundException(err, productId);
    }
  }

  async likeProduct(userId: number, productId: number) {
    try {
      await this.prisma.likesOnProduct.create({
        data: {
          product: {
            connect: {
              id: productId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === PrismaError.UniqueConstraintFailed) {
          throw new ProductAlreadyLiked(productId);
        }
        if (err.code === PrismaError.ModelDoesNotExist) {
          throw new ProductNotFoundException(productId);
        }
      }
      throw err;
    }
    return null;
  }

  private async uploadFile(file: Express.Multer.File) {
    const extension = file.originalname.split('.').slice(-1);
    const filename = `${uuidv4()}.${extension}`;
    return await this.aws.uploadFile(file.buffer, filename);
  }

  private handleNotFoundException(err: Error, productId: number) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === PrismaError.ModelDoesNotExist
    ) {
      throw new ProductNotFoundException(productId);
    }
    throw err;
  }
}
