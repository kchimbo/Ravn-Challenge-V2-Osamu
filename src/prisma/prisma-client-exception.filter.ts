import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
@Catch()
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    // const message = exception.message.replace(/\n/g, '');
    // console.log(exception.meta);
    switch (exception.code) {
      case 'P2002': // unique
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: `${exception?.meta?.target} already exists`,
        });
        break;
      case 'P2025':
        break;
      default:
        super.catch(exception, host);
        break;
    }
  }
}
