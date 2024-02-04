import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailsService } from './services/emails.service';
import { EmailsProcessor } from './processors/emails.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emails',
    }),
    MailerModule.forRoot({
      transport: {
        host: '127.0.0.1',
        port: 1025,
        secure: false,
      },
      defaults: {
        from: 'admin@challenge.lat <admin@challenge.lat>',
      },
    }),
  ],
  providers: [BullModule, EmailsService, EmailsProcessor],
  exports: [BullModule, EmailsService],
})
export class EmailsModule {}
