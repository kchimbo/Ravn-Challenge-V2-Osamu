import { Test, TestingModule } from '@nestjs/testing';
import { EmailsProcessor } from './emails.processor';
import { MailerService } from '@nestjs-modules/mailer';
import { Job } from 'bull';
import { AuthService } from '../../auth/services/auth.service';

describe('UsersService', () => {
  let processor: EmailsProcessor;
  let mailerService: MailerService;

  const sample = {
    email: 'client@example.com',
    productName: 'sample-product',
    token: 'reset_password_token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsProcessor,
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn() },
        },
      ],
    }).compile();

    processor = module.get<EmailsProcessor>(EmailsProcessor);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should send a product back in stock email', async () => {
    const job = {
      data: {
        email: sample.email,
        name: sample.productName,
      },
    } as Job;
    await processor.handleProductInStock(job);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      subject: `${sample.productName} is back in stock`,
      text: expect.stringContaining(
        `The product ${sample.productName} is back in stock`,
      ),
      to: 'client@example.com',
    });
  });

  it('should send a password reset email', async () => {
    const job = {
      data: {
        email: sample.email,
        resetPasswordKey: sample.token,
      },
    } as Job;
    await processor.handleResetPassword(job);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      subject: 'Reset your password',
      text: expect.stringContaining(
        `Please use the following key to reset your password: ${sample.token}`,
      ),
      to: 'client@example.com',
    });
  });

  it('should send a password changed email', async () => {
    const job = {
      data: {
        email: sample.email,
      },
    } as Job;
    await processor.handleChangePassword(job);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      subject: 'Password change notification',
      text: 'Your password has been changed.',
      to: 'client@example.com',
    });
  });
});
