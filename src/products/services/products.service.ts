import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { Prisma } from '@prisma/client';
import { ProductAlreadyLiked } from '../exceptions/product-already-liked';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { PrismaError } from '../../prisma/prisma.errors';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { AwsService } from '../../aws/aws.service';
import { v4 as uuidv4 } from 'uuid';
import { forkJoin, mergeMap, of, reduce, switchMap, tap } from 'rxjs';
import { CreateProductDto } from '../dto/create-product.dto';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { DeleteImageDto } from '../dto/delete-image.dto';
import * as _ from 'lodash';

@Injectable()
export class ProductsService {
  private logger = new Logger(ProductsService.name);
  constructor(
    private prisma: PrismaService,
    private aws: AwsService,
  ) {}

  async listProduct(limit: number, cursor?: number, where?: object) {
    if (_.isEmpty(where)) {
      where = {
        isDisabled: false,
        deletedAt: null,
      };
    } else {
      where = {
        ...where,
        isDisabled: false,
        deletedAt: null,
      };
    }
    this.logger.log(where, typeof cursor);
    if (cursor != undefined && cursor > 0) {
      return this.prisma.product.findMany({
        take: limit,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where,
      });
    }
    return this.prisma.product.findMany({
      take: limit,
      where,
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

  async createProduct(
    product: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    let categoryId;
    console.log(product);
    console.log(files);
    // check if category exists
    try {
      categoryId = await this.prisma.category.findUniqueOrThrow({
        where: {
          slug: product.category,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PrismaError.ModelDoesNotExist
      ) {
        throw new CategoryNotFoundException(product.category);
      }
      throw err;
    }

    const [{ id }] = await this.prisma.$transaction([
      this.prisma.product.create({
        data: {
          ...product,
          category: {
            connect: {
              id: categoryId.id,
            },
          },
        },
      }),
    ]);

    if (files.length > 0) {
      console.log('Creating new files');
      await this.addImagesToProduct(id, files).toPromise();
    } else {
      console.log('Files are empty. Skipping');
    }

    return id;
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

  addImagesToProduct(productId: number, files: Array<Express.Multer.File>) {
    return of(...files).pipe(
      mergeMap(async (file) => await this.uploadFile(file)),
      reduce(
        (acc, i) => [
          ...acc,
          { url: i.Location, filename: i.Key, productId: productId },
        ],
        [],
      ),
      switchMap(async (data) => {
        return this.prisma.image.createMany({
          data,
        });
      }),
    );
  }

  async removeImagesFromProduct(deleteImageParameters: DeleteImageDto) {
    const productImage = await this.prisma.image.findMany({
      where: deleteImageParameters,
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
    console.log(`Uploading file ${file.filename} as ${filename} to S3`);
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
