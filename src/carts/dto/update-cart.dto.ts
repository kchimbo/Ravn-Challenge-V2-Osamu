import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class UpdateCartDto {
  @ApiProperty({ isArray: true, type: UpdateCartItemDto })
  @IsArray()
  @Type(() => UpdateCartItemDto)
  products: UpdateCartItemDto[];
}
