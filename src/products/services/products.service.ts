import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { Prisma } from '@prisma/client';
import { ProductAlreadyLiked } from '../exceptions/product-already-liked';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { PrismaError } from '../../prisma/prisma.errors';
import { ProductDetailsDto } from '../dto/product-details.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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

  async addImagesToProduct() {
    return 'add_images_to_product';
  }

  async removeImagesFromProduct() {
    return 'remove_images_from_product';
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
