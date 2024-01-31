import { HasMimeType, IsFiles, MemoryStoredFile } from 'nestjs-form-data';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  price: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  stock: number;

  @ApiProperty()
  @IsString()
  category: string;
}
