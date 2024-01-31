import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { CartDto } from './dto/cart.dto';

@Controller('carts')
@UseInterceptors(ClassSerializerInterceptor)
export class CartsController {
  constructor(private cartsService: CartsService) {}
  @Post('/')
  async checkoutCart() {
    return 'checkout_card';
  }

  @Patch('/')
  @ApiOperation({
    summary: 'Get the cart of the current user',
  })
  @ApiBearerAuth('access_token')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard)
  @Get('/')
  async updateCart(@GetCurrentUserId() userId: number) {
    return this.cartsService.updateItemCart(userId, 0, 0);
  }

  @ApiOperation({
    summary: 'Get the cart of the current user',
  })
  @ApiBearerAuth('access_token')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getCart(@GetCurrentUserId() userId: number) {
    const cart = await this.cartsService.getCart(userId);
    return new CartDto(cart);
  }
}
