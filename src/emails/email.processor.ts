import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  constructor(private readonly mailerService: MailerService) {}

  @Process('productInStock')
  handleProductInStock(job: Job) {
    this.logger.log('Sending product in stock email');
  }

  @Process('resetPassword')
  handleResetPassword(job: Job) {
    this.logger.log('Sending reset password email');
  }

  @Process('changedPassword')
  handleChangePassword(job: Job) {
    this.logger.log('Sending password changed email');
    this.mailerService
      .sendMail({
        to: 'abcd@example.com',
        subject: 'abcd',
        text: 'Your password has been changed',
      })
      .then(() => {})
      .catch(() => {});
  }
}
