import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { Prisma } from '@prisma/client';
import { ProductAlreadyLiked } from '../exceptions/product-already-liked';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { PrismaError } from '../../prisma/prisma.errors';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { AwsService } from '../../aws/aws.service';
import { v4 as uuidv4 } from 'uuid';
import {
  forkJoin,
  lastValueFrom,
  mergeMap,
  of,
  reduce,
  switchMap,
  tap,
} from 'rxjs';
import { CreateProductDto } from '../dto/create-product.dto';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { DeleteImageDto } from '../dto/delete-image.dto';
import * as _ from 'lodash';
import { UpdateProductDto } from '../dto/update-product.dto';

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
        where: where,
        include: {
          category: true,
          Image: true,
        },
      });
    }
    const r = await this.prisma.product.findMany({
      take: limit,
      where,
      include: {
        category: true,
        Image: true,
      },
    });

    console.log(r);
    return r;
  }

  async getProductDetails(productId: number) {
    try {
      return await this.prisma.product.findUniqueOrThrow({
        where: {
          id: productId,
          isDisabled: false,
          deletedAt: null,
        },
        include: {
          category: true,
          Image: true,
        },
      });
    } catch (err) {
      this.handleNotFoundException(err, productId);
    }
  }

  async getProductsByCategory(productName: string, category?: number) {
    return this.prisma.product.findMany({
      where: {
        name: {
          contains: productName,
          mode: 'insensitive',
        },
        isDisabled: false,
        deletedAt: null,
        category: {
          id: category,
        },
      },
    });
  }

  async createProduct(
    product: CreateProductDto,
    files?: Array<Express.Multer.File>,
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

    console.log(categoryId);

    const createdProduct = await this.prisma.product.create({
      data: {
        ...product,
        category: {
          connect: {
            id: categoryId.id,
          },
        },
      },
    });

    if (files != undefined && files.length > 0) {
      console.log('Creating new files');
      await this.addImagesToProduct(createdProduct.id, files);
    } else {
      console.log('Files are empty. Skipping');
    }

    return await this.getProductDetails(createdProduct.id);
  }

  async updateProduct(productId: number, details: UpdateProductDto) {
    console.log('Updating product...');
    console.log(details);
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
    return lastValueFrom(
      of(...files).pipe(
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
      ),
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

    if (deleteImageParameters.id) {
      const dbImages = productImage.map(({ id }) => id);
      if (!dbImages.includes(deleteImageParameters.id)) {
        throw new NotFoundException(
          `The image ${deleteImageParameters.id} was not found`,
        );
      }
    }

    return await lastValueFrom(
      of(...productImage).pipe(
        mergeMap(({ id, filename }) =>
          forkJoin([of(id), this.aws.deleteFile(filename)]),
        ),
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
      ),
    );
  }

  async deleteProduct(productId: number) {
    console.log('Deleting product....');
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
    await this.getProductDetails(productId);
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
