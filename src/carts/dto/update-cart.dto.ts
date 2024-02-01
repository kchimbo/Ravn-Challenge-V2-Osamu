import { Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';

export class UpdateCartDto {
  @IsArray()
  @Type(() => UpdateCartItemDto)
  products: UpdateCartItemDto[];
}

class UpdateCartItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}
