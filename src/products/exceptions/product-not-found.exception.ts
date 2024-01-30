import { NotFoundException } from '@nestjs/common';

export class ProductNotFoundException extends NotFoundException {
  constructor(productId: number) {
    super(`Product ID:${productId} was not found`);
  }
}
