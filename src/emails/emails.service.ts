import { Injectable, Logger } from '@nestjs/common';
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

  async sendPasswordResetEmail(email: string, resetPasswordKey: string) {
    await this.emailQueue.add('resetPassword', {
      resetPasswordKey,
      email,
    });
  }

  async sendChangedPasswordEmail(email: string) {
    await this.emailQueue.add('changedPassword', {
      email,
    });
  }
}
