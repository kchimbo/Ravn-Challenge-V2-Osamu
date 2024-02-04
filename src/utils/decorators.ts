import { BadRequestException, Body, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export const ValidBody = () =>
  Body(
    new ValidationPipe({
      skipMissingProperties: true,
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[] = []) => {
        return new BadRequestException(
          errors.map((error) => ({
            field: error.property,
            error: error?.constraints
              ? Object.values(error?.constraints).join(', ')
              : '',
          })),
        );
      },
    }),
  );
