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
import { UpdateCartDto } from './dto/update-cart.dto';
import { ValidBody } from '../utils/decorators';

@Controller('carts')
@UseInterceptors(ClassSerializerInterceptor)
export class CartsController {
  constructor(private cartsService: CartsService) {}
  @Post('/')
  @UseGuards(JwtAuthGuard)
  async checkoutCart(@GetCurrentUserId() userId: number) {
    return this.cartsService.checkoutCart(userId);
  }

  @Patch('/')
  @ApiOperation({
    summary: 'Add/Update/Delete items on the cart of the current user',
  })
  @ApiBearerAuth('access_token')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard)
  async updateCart(
    @GetCurrentUserId() userId: number,
    @ValidBody() updateCart: UpdateCartDto,
  ) {
    return this.cartsService.updateItemCart(userId, updateCart);
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

  @ApiOperation({
    summary: 'Delete the cart of the current user',
  })
  @ApiBearerAuth('access_token')
  @UseGuards(JwtAuthGuard)
  @Delete('/')
  async deleteCart(@GetCurrentUserId() userId: number) {
    return await this.cartsService.deleteCart(userId);
  }
}
