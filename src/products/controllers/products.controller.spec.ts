import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { CartsService } from '../../carts/carts.service';
import { ProductsService } from '../services/products.service';
import { PaginationParamsDto } from '../dto/pagination-params.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductDetailsDto } from '../dto/product-details.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            listProduct: jest.fn(),
            getProductDetails: jest.fn(),
            getProductsByCategory: jest.fn(),
            createProduct: jest.fn(),
            updateProduct: jest.fn(),
            addImagesToProduct: jest.fn(),
            removeImagesFromProduct: jest.fn(),
            deleteProduct: jest.fn(),
            likeProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listProducts', async () => {
    await controller.listProducts({ limit: 5 } as PaginationParamsDto);
    expect(productsService.listProduct).toHaveBeenCalled();
  });

  it('getProductDetails', async () => {
    await controller.getProductDetails(1);
    expect(productsService.getProductDetails).toHaveBeenCalled();
  });

  it('searchProducts', async () => {
    await controller.searchProducts('foobar');
    expect(productsService.getProductsByCategory).toHaveBeenCalled();
  });

  it('createProduct', async () => {
    await controller.createProduct({} as CreateProductDto);
    expect(productsService.createProduct).toHaveBeenCalled();
  });

  it('updateProduct', async () => {
    await controller.updateProduct(100, {} as ProductDetailsDto);
    expect(productsService.updateProduct).toHaveBeenCalled();
  });

  it('addImagesToProduct', async () => {
    await controller.addImagesToProduct(100, [
      {
        fieldname: 'files',
        originalname: 'sample-file.png',
        mimetype: 'image/png',
      } as Express.Multer.File,
    ]);
    expect(productsService.addImagesToProduct).toHaveBeenCalled();
  });

  it('deleteImageFromProduct', async () => {
    await controller.deleteImageFromProduct(100);
    expect(productsService.removeImagesFromProduct).toHaveBeenCalled();
  });

  it('deleteImagesFromProduct', async () => {
    await controller.deleteImagesFromProduct(200);
    expect(productsService.removeImagesFromProduct).toHaveBeenCalled();
  });

  it('deleteProduct', async () => {
    await controller.deleteProduct(100);
    expect(productsService.deleteProduct).toHaveBeenCalled();
  });

  it('likeProduct', async () => {
    await controller.likeProduct(100, 200);
    expect(productsService.likeProduct).toHaveBeenCalled();
  });
});
