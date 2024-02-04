import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class EmailsService {
  constructor(@InjectQueue('emails') private readonly emailQueue) {}

  async sendProductInStockEmail(email: string, name: string) {
    await this.emailQueue.add('productInStock', {
      email,
      name,
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
