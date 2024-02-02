import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';

export class ProductDetailsDto {
  @Exclude()
  id: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  stock: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @IsOptional()
  @Exclude({ toPlainOnly: true })
  isDisabled: boolean;
}
