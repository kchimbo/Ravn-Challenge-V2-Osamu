import { NotFoundException } from '@nestjs/common';

export class CategoryNotFoundException extends NotFoundException {
  constructor(category: string) {
    super(`Category '${category}' was not found`);
  }
}
