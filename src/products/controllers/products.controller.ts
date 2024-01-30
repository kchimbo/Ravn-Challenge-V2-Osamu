import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/types/roles.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Product')
@Controller('products')
export class ProductsController {
  @Get('/')
  @ApiOperation({
    summary: 'List products',
  })
  async listProducts() {
    return 'list_products';
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get product details',
  })
  async getProductDetails() {
    return 'get_product_details';
  }

  @ApiOperation({
    summary: 'Search products by category',
  })
  @Get('/:category/:search')
  async searchProducts() {
    return 'search_products';
  }

  @ApiOperation({
    summary: 'Create a new product',
  })
  @Post('/')
  @ApiBearerAuth('access_token')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async createProduct() {
    return 'create_product';
  }

  @ApiOperation({
    summary: 'Update product information',
  })
  @ApiBearerAuth('access_token')
  @Put('/')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async updateProduct() {
    // also disable product
    return 'update_product';
  }

  @ApiOperation({
    summary: 'Add images to product',
  })
  @ApiBearerAuth('access_token')
  @Post('/:id/images')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async addImagesToProduct() {
    // also disable product
    return 'add_images_to_product';
  }

  @ApiOperation({
    summary: 'Remove images from product',
  })
  @ApiBearerAuth('access_token')
  @Delete('/:id/images')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteImagesFromProduct() {
    // also disable product
    return 'remove_images_to_product';
  }

  @ApiOperation({
    summary: 'Delete a product',
  })
  @ApiBearerAuth('access_token')
  @Delete('/')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteProduct() {
    return 'delete_product';
  }

  @ApiOperation({
    summary: 'Like a product',
  })
  @ApiBearerAuth('access_token')
  @Post('/:id/like')
  @UseGuards(JwtAuthGuard)
  async likeProduct() {
    return 'like_product';
  }
}
