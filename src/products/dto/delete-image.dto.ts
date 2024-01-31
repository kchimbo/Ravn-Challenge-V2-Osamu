import { IsNumber, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteImageDto {
  @ValidateIf((dto) => typeof dto.id === 'undefined')
  @Transform(({ value }) => Number(value))
  @IsNumber()
  productId?: number;

  @ValidateIf((dto) => typeof dto.productId === 'undefined')
  @Transform(({ value }) => Number(value))
  @IsNumber()
  id?: number;
}
