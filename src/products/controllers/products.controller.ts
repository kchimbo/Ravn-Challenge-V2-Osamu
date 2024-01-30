import { Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/types/roles.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async createProduct() {
    return 'create_product';
  }

  @ApiOperation({
    summary: 'Update product information',
  })
  @Put('/')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async updateProduct() {
    // also disable product
    return 'update_product';
  }

  @ApiOperation({
    summary: 'Delete a product',
  })
  @Delete('/')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteProduct() {
    return 'delete_product';
  }

  @ApiOperation({
    summary: 'Like a product',
  })
  @Post('/:id/like')
  @UseGuards(JwtAuthGuard)
  async likeProduct() {
    return 'like_product';
  }
}
