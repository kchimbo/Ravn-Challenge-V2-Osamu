import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';
import { getQueueToken } from '@nestjs/bull';

describe('EmailsService', () => {
  const sample = {
    email: 'client@example.com',
    productName: 'sample-product',
    token: 'reset_password_token',
  };

  let service: EmailsService;
  let module: TestingModule;
  let mockQueue: any;
  const createApp = async () => {
    module = await Test.createTestingModule({
      providers: [
        EmailsService,
        {
          provide: getQueueToken('emails'),
          useValue: mockQueue,
        },
      ],
    }).compile();
  };
  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    };
    await createApp();

    service = module.get<EmailsService>(EmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a reset-password email to the queue', async () => {
    await service.sendPasswordResetEmail(sample.email, sample.token);

    expect(mockQueue.add).toHaveBeenCalledWith('resetPassword', {
      email: 'client@example.com',
      resetPasswordKey: 'reset_password_token',
    });
  });

  it('should add a changed-password email to the queue', async () => {
    await service.sendChangedPasswordEmail(sample.email);

    expect(mockQueue.add).toHaveBeenCalledWith('changedPassword', {
      email: 'client@example.com',
    });
  });

  it('should add a product-in-stock email to the queue', async () => {
    await service.sendProductInStockEmail(sample.email, sample.productName);

    expect(mockQueue.add).toHaveBeenCalledWith('productInStock', {
      email: 'client@example.com',
      name: 'sample-product',
    });
  });
});
