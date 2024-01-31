import { Controller, Get } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  @Get('/')
  async getOrders() {
    return 'get_orders';
  }

  @Get('/:id')
  async getOrderId() {
    return 'get_order_for_specific_id';
  }
}
