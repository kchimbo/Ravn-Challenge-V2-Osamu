import {
  Controller,
  Get,
  ParseIntPipe,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { OrdersService } from './orders.service';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Get('/')
  @ApiOperation({
    summary: 'Get all the orders of the current user',
  })
  @ApiBearerAuth('access_token')
  @UseGuards(JwtAuthGuard)
  async getOrders(@GetCurrentUserId() userId) {
    return this.ordersService.getOrderForUser(userId);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get all the orders of the given user id',
  })
  @ApiBearerAuth('access_token')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getOrderId(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderForUser(id);
  }
}
