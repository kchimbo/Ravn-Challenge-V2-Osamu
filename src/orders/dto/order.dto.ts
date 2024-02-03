import { Order, OrderItem } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
class OrderItemEntity implements OrderItem {
  constructor(partial: Partial<OrderItemEntity>) {
    Object.assign(this, partial);
  }
  id: number;
  orderId: number;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiProperty()
  @Expose()
  productId: number;

  @ApiProperty()
  @Expose()
  quantity: number;
  userId: number | null;

  @ApiProperty()
  @Transform(({ obj }) => obj.product.name)
  @Expose()
  name?: string;
}

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

  @ApiProperty({
    name: 'items',
    type: OrderItemEntity,
    isArray: true,
  })
  @Expose({ name: 'items' })
  orderItem: OrderItemEntity[];
}
