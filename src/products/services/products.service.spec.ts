import { Test, TestingModule } from '@nestjs/testing';
jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));

import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prima.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { AwsService } from '../../aws/aws.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaError } from '../../prisma/prisma.errors';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { ProductDetailsDto } from '../dto/product-details.dto';
import { ProductAlreadyLiked } from '../exceptions/product-already-liked';
import { CategoryNotFoundException } from '../exceptions/category-not-found.exception';
import { DeleteImageDto } from '../dto/delete-image.dto';
describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: DeepMockProxy<PrismaService>;
  let awsService: AwsService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        PrismaService,
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: AwsService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<ProductsService>(ProductsService);
    awsService = module.get(AwsService);
    prismaService = module.get(PrismaService);
  });

  it('the service should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * List products
   */
  it('listProduct should list only the active products', () => {
    service.listProduct(5);
    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      take: 5,
      where: {
        deletedAt: null,
        isDisabled: false,
      },
      include: {
        Image: true,
        category: true,
      },
    });
  });

  it('listProduct should list only the active products and work with pagination', () => {
    service.listProduct(5, 2);
    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      take: 5,
      skip: 1,
      cursor: {
        id: 2,
      },
      where: {
        deletedAt: null,
        isDisabled: false,
      },
      include: {
        Image: true,
        category: true,
      },
    });
  });

  /**
   * Get product details
   */
  it('getProductDetails should get the product details if the product exists', () => {
    service.getProductDetails(1);
    expect(prismaService.product.findUniqueOrThrow).toHaveBeenCalledWith({
      where: {
        id: 1,
        deletedAt: null,
        isDisabled: false,
      },
      include: {
        Image: true,
        category: true,
      },
    });
  });

  it("getProductsDetails should throw an error if the product doesn't exist", () => {
    prismaService.product.findUniqueOrThrow.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.ModelDoesNotExist,
        clientVersion: '1',
      });
    });
    expect(service.getProductDetails(1)).rejects.toThrow(
      ProductNotFoundException,
    );
  });

  /**
   * Delete product
   */
  it('deleteProduct should delete the product if the product exists', () => {
    service.deleteProduct(1);
    expect(prismaService.product.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });
  });

  it("deleteProduct should throw an error if the product doesn't exist", () => {
    prismaService.product.delete.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.ModelDoesNotExist,
        clientVersion: '1',
      });
    });
    expect(service.deleteProduct(1)).rejects.toThrow(ProductNotFoundException);
  });

  /**
   * Update product
   */
  it('updateProduct should update the product details if the product it exists', () => {
    service.updateProduct(1, { name: 'new-product-name' } as ProductDetailsDto);
    expect(prismaService.product.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        name: 'new-product-name',
      },
    });
  });

  it("updateProduct should throw an error if the product doesn't exist", () => {
    prismaService.product.update.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.ModelDoesNotExist,
        clientVersion: '1',
      });
    });
    expect(
      service.updateProduct(1, {
        name: 'non-existent-product',
      } as ProductDetailsDto),
    ).rejects.toThrow(ProductNotFoundException);
  });

  /**
   * Add an image to a product
   */
  it('should add image(s) to an existing product', async () => {
    jest
      .spyOn(awsService, 'uploadFile')
      .mockImplementation((buffer, filename) =>
        Promise.resolve({
          Location: `aws_url/${filename}`,
          Key: `${filename}`,
        }),
      );

    await service.addImagesToProduct(100, [
      {
        filename: 'sample-file.png',
        originalname: 'sample-file.png',
        buffer: Buffer.from('image_data'),
      } as Express.Multer.File,
    ]);

    expect(awsService.uploadFile).toHaveBeenCalled();
    expect(prismaService.image.createMany).toHaveBeenCalledWith({
      data: [
        {
          filename: 'mocked-uuid.png',
          productId: 100,
          url: 'aws_url/mocked-uuid.png',
        },
      ],
    });
  });

  /**
   * Remove an image from a product
   */
  it('should delete images from an existing product', async () => {
    jest.spyOn(awsService, 'deleteFile').mockImplementation((filename) =>
      Promise.resolve({
        id: 1,
      }),
    );

    prismaService.image.findMany.mockResolvedValue([
      {
        id: 1,
        filename: 'image_to_be_deleted.png',
        productId: 1,
        url: 'aws/image_to_be_deleted.png',
      },
    ]);

    await service.removeImagesFromProduct({ id: 1 });
  });

  /**
   * Create a product
   */
  it("createProduct throws an error if the category doesn't exists", async () => {
    prismaService.category.findUniqueOrThrow.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.ModelDoesNotExist,
        clientVersion: '1',
      });
    });

    await expect(
      service.createProduct({
        name: 'a new product',
        description: '',
        price: 99,
        stock: 1,
        category: 'sample-category-1',
      }),
    ).rejects.toThrow(CategoryNotFoundException);
  });

  it('createProduct should be able create a new product without an image', async () => {
    prismaService.category.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      name: 'Sample Category 1',
      slug: 'sample-category-1',
    });

    const newProduct = {
      id: 100,
      name: '',
      description: '',
      price: 1,
      stock: 1,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      isDisabled: false,
    };
    prismaService.product.create.mockResolvedValue(newProduct);
    prismaService.product.findUniqueOrThrow.mockResolvedValueOnce(newProduct);

    await expect(
      service.createProduct({
        name: 'a new product',
        description: '',
        price: 99,
        stock: 1,
        category: 'sample-category-1',
      }),
    ).resolves.toBe(newProduct);
    expect(prismaService.product.create).toHaveBeenCalledWith({
      data: {
        name: 'a new product',
        price: 99,
        stock: 1,
        description: '',
        category: {
          connect: {
            id: 1,
          },
        },
      },
    });
  });

  /**
   * Search product by category
   */

  /**
   * Like product
   */
  it('likeProduct should add a like if the product exists and is not currently liked', async () => {
    await service.likeProduct(200, 100);
    expect(prismaService.likesOnProduct.create).toHaveBeenCalledWith({
      data: {
        product: {
          connect: {
            id: 100,
          },
        },
        user: {
          connect: {
            id: 200,
          },
        },
      },
    });
  });

  it("likeProduct should throw an error if the product doesn't exist", () => {
    prismaService.likesOnProduct.create.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.ModelDoesNotExist,
        clientVersion: '1',
      });
    });
    expect(service.likeProduct(100, 200)).rejects.toThrow(
      ProductNotFoundException,
    );
  });

  it("likeProduct should throw an error if the product doesn't exist", () => {
    prismaService.likesOnProduct.create.mockImplementation(() => {
      throw new PrismaClientKnownRequestError('', {
        code: PrismaError.UniqueConstraintFailed,
        clientVersion: '1',
      });
    });
    expect(service.likeProduct(100, 200)).rejects.toThrow(ProductAlreadyLiked);
  });
});
