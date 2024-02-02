import { Type, Expose, Exclude, Transform } from 'class-transformer';
import { Cart, CartItem } from '@prisma/client';

class ProductDto {
  stock: number;
}
export class CartDto {
  @Expose()
  userId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt?: Date | null;

  @Expose()
  @Type(() => CartItemDto)
  cartItem: CartItemDto[];

  constructor(partial: Partial<Cart>) {
    Object.assign(this, partial);
  }
}

@Exclude()
class CartItemDto {
  @Expose()
  productId: number;

  @Expose()
  @Transform(({ obj }) => obj.product.category.slug)
  category: string;

  @Expose()
  quantity: number;

  @Expose()
  @Transform(({ obj }) => obj.product.stock)
  stock: number;

  @Expose()
  @Transform(({ obj }) => obj.product.price)
  price: number;

  @Expose()
  @Transform(({ obj }) => obj.product.name)
  name: string;

  @Expose()
  @Transform(({ obj }) => obj.product.createdAt)
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.product.updatedAt)
  updatedAt: Date;
}
