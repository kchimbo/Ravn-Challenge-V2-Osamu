import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';

export class ProductDetailsDto {
  @Exclude()
  id: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  price: number;

  @IsOptional()
  @IsString()
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
