import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('emails')
export class EmailsProcessor {
  constructor(private readonly mailerService: MailerService) {}

  @Process('productInStock')
  async handleProductInStock(job: Job) {
    const {
      data: { email, name },
    } = job;

    await this.mailerService.sendMail({
      to: email,
      subject: `${name} is back in stock`,
      text: `
        The product ${name} is back in stock.
      `,
    });
  }

  @Process('resetPassword')
  async handleResetPassword(job: Job) {
    const {
      data: { email, resetPasswordKey },
    } = job;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      text: `
      
      We have received your request to reset your password. 
      
      Please use the following key to reset your password: ${resetPasswordKey}
      `,
    });
  }

  @Process('changedPassword')
  async handleChangePassword(job: Job) {
    const {
      data: { email },
    } = job;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password change notification',
      text: 'Your password has been changed.',
    });
  }
}
