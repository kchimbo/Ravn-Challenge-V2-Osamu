import { IsBoolean, IsNumber, IsString } from 'class-validator';

class UpdateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock: number;

  @IsBoolean()
  isDisabled: boolean;
}
