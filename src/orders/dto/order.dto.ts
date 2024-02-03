import { Order, OrderItem } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class OrderEntity implements Order {
  constructor({ orderItem, ...data }: Partial<OrderEntity>) {
    Object.assign(this, data);

    if (orderItem) {
      this.orderItem = orderItem.map((item) => new OrderItemEntity(item));
    }
  }

  @ApiProperty()
  @Expose()
  createdAt: Date;

  id: number;
  @ApiProperty()
  @Expose()
  total: number;

  userId: number;

  @Expose({ name: 'items' })
  orderItem: OrderItemEntity[];
}

@Exclude()
class OrderItemEntity implements OrderItem {
  constructor(partial: Partial<OrderItemEntity>) {
    Object.assign(this, partial);
  }
  id: number;
  orderId: number;

  @Expose()
  price: number;
  @Expose()
  productId: number;
  @Expose()
  quantity: number;
  userId: number | null;

  @Transform(({ obj }) => obj.product.name)
  @Expose()
  name?: string;
}
