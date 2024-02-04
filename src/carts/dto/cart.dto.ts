import { Type, Expose, Exclude, Transform } from 'class-transformer';
import { Cart, CartItem } from '@prisma/client';

export class CartDto {
  @Expose()
  userId: number;

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
  @Transform(({ obj }) => obj.product.price)
  price: number;

  @Expose()
  @Transform(({ obj }) => obj.product.name)
  name: string;
}
