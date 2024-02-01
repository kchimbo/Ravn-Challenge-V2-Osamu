import {
  Controller,
  Get,
  ParseIntPipe,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { OrdersService } from './orders.service';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Get('/')
  @ApiOperation({
    summary: 'Get all the orders of the current user',
  })
  @ApiBearerAuth('access_token')
  @ApiResponse({
    status: 200,
    description: 'An array containing the orders',
  })
  @ApiResponse({
    status: 401,
    description: 'The token is no longer valid or is missing',
  })
  @UseGuards(JwtAuthGuard)
  async getOrders(@GetCurrentUserId() userId) {
    return this.ordersService.getOrderForUser(userId);
  }

  @Get('/:userId')
  @ApiOperation({
    summary: 'Get all the orders of the given user id',
  })
  @ApiBearerAuth('access_token')
  @ApiResponse({
    status: 200,
    description: 'An array containing the orders for the given user id',
  })
  @ApiResponse({
    status: 401,
    description: 'The token is no longer valid or is missing',
  })
  @ApiResponse({
    status: 403,
    description: "You don't have permissions to access this page",
  })
  @ApiResponse({
    status: 404,
    description: "The specified user doesn't exist",
  })
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getOrderId(@Param('userId', ParseIntPipe) id: number) {
    return this.ordersService.getOrderForUser(id);
  }
}
