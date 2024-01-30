import { BadRequestException } from '@nestjs/common';

export class ProductNotFoundException extends BadRequestException {
  constructor(productId: number) {
    super(`Product ID:${productId} was not found`);
  }
}
