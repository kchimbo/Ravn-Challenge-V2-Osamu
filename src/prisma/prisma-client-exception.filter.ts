import {
  ArgumentsHost,
  BadGatewayException,
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
    console.log(exception);
    console.log('Exception has been thrown');
    switch (exception.code) {
      case 'P2002': // unique
        const status = HttpStatus.CONFLICT;
        console.log('Handling exception');
        response.status(status).json({
          statusCode: status,
          message: `${exception?.meta?.target} already exists`,
        });
        break;
      case 'P2025':
        response.status(209);
      default:
        console.log(exception);
        console.log('bad');
        super.catch(exception, host);
        break;
    }
  }
}
