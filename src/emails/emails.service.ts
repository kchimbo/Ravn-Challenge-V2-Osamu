import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class EmailsService {
  constructor(@InjectQueue('emails') private readonly emailQueue) {}

  async sendProductInStockEmail() {
    await this.emailQueue.add('productInStock', {
      productId: 1,
      userId: 100,
    });
  }

  async sendPasswordResetEmail() {
    await this.emailQueue.add('resetPassword', {
      resetPasswordKey: 'abcd',
      email: 'foobar@gmail.com',
    });
  }

  async sendChangedPasswordEmail() {
    await this.emailQueue.add('changedPassword', {
      email: 'reset_password@example.com',
    });
  }
}
