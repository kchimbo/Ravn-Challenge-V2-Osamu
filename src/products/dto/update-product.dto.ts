import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Exclude } from 'class-transformer';

export class UpdateProductDto {
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
