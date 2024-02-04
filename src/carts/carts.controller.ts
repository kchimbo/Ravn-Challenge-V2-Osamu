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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { CartDto } from './dto/cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ValidBody } from '../utils/decorators';
import { TransformDataInterceptor } from '../utils/transform-data.interceptor';
import { UserDto } from '../auth/dto/user.dto';

@Controller('carts')
@ApiTags('Cart')
@UseInterceptors(ClassSerializerInterceptor)
export class CartsController {
  constructor(private cartsService: CartsService) {}
  @Post('/')
  @ApiBearerAuth('access_token')
  @UseGuards(JwtAuthGuard)
  async checkoutCart(@GetCurrentUserId() userId: number) {
    return this.cartsService.checkoutCart(userId);
  }

  @Patch('/')
  @ApiOperation({
    summary: 'Add/Update/Delete items on the cart of the current user',
  })
  @ApiBearerAuth('access_token')
  @ApiBody({
    type: UpdateCartDto,
  })
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard)
  async updateCart(
    @GetCurrentUserId() userId: number,
    @ValidBody() updateCart: UpdateCartDto,
  ) {
    const updatedCart = await this.cartsService.updateItemCart(
      userId,
      updateCart,
    );
    return new CartDto(updatedCart);
  }

  @ApiOperation({
    summary: 'Get the current cart',
  })
  @ApiBearerAuth('access_token')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getCart(@GetCurrentUserId() userId: number) {
    const cart = await this.cartsService.getOrCreateCart(userId);
    return new CartDto(cart);
  }

  @ApiOperation({
    summary: 'Clear the current cart',
  })
  @ApiBearerAuth('access_token')
  @UseGuards(JwtAuthGuard)
  @Delete('/')
  async deleteCart(@GetCurrentUserId() userId: number) {
    return await this.cartsService.deleteCart(userId);
  }
}
