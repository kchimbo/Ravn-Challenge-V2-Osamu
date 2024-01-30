import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';

export class ProductDetailsDto {
  id: number;
  name: string;
  price: number;
  stock: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Exclude()
  isDisabled: boolean;
}
