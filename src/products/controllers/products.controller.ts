import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/types/roles.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUserId } from '../../auth/decorators/get-current-user-id.decorator';
import { ProductsService } from '../services/products.service';
import { TransformDataInterceptor } from '../../utils/transform-data.interceptor';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { PaginationParamsDto } from '../dto/pagination-params.dto';

@ApiTags('Product')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get('/')
  @ApiOperation({
    summary: 'List products',
  })
  @UseInterceptors(new TransformDataInterceptor(ProductDetailsDto))
  @UsePipes(new ValidationPipe({ transform: true }))
  async listProducts(@Query() { offset, limit }: PaginationParamsDto) {
    return this.productsService.listProduct(offset, limit);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get product details',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The id of the product',
  })
  @UseInterceptors(new TransformDataInterceptor(ProductDetailsDto))
  async getProductDetails(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.getProductDetails(productId);
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
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The id of the product',
  })
  @Put(':id')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async updateProduct(
    @Param('id', ParseIntPipe) productId: number,
    details: ProductDetailsDto,
  ) {
    return this.productsService.updateProduct(productId, details);
  }

  @ApiOperation({
    summary: 'Add images to product',
  })
  @ApiBearerAuth('access_token')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The id of the product',
  })
  @Post('/:id/images')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async addImagesToProduct() {
    // also disable product
    return 'add_images_to_product';
  }

  @ApiOperation({
    summary: 'Remove image(s) from product',
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
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The id of the product',
  })
  @Delete('/:id')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async deleteProduct(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.deleteProduct(productId);
  }

  @ApiOperation({
    summary: 'Like a product',
  })
  @ApiBearerAuth('access_token')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The id of the product',
  })
  @Post('/:id/like')
  @UseGuards(JwtAuthGuard)
  async likeProduct(
    @Param('id', ParseIntPipe) productId: number,
    @GetCurrentUserId() userId: number,
  ) {
    await this.productsService.likeProduct(userId, productId);

    return null;
  }
}
