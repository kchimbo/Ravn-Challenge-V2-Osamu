import { BadRequestException } from '@nestjs/common';

export class ProductAlreadyLiked extends BadRequestException {
  constructor(productId: number) {
    super(`Product ID:${productId} was already liked by the user`);
  }
}
