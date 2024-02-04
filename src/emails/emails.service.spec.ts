import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';
import { BullModule, getQueueToken } from '@nestjs/bull';

describe('EmailsService', () => {
  let service: EmailsService;
  const sample = {
    email: 'client@example.com',
    productName: 'sample-product',
    token: 'reset_password_token',
  };

  let module: TestingModule;
  let mockQueue;
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
    // const moduleRef = await Test.createTestingModule({
    //   providers: [
    //     EmailsService,
    //     {
    //       provide: getQueueToken('emails'),
    //       useValue: {
    //         add: jest.fn(),
    //       },
    //     },
    //   ],
    // }).compile();
    mockQueue = {
      add: jest.fn(),
    };
    await createApp();

    service = module.get<EmailsService>(EmailsService);
  });

  // afterAll(async () => {
  //   await moduleRef.close();
  // });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a reset-password email to the queue', async () => {
    await service.sendPasswordResetEmail(sample.email, sample.token);

    expect(mockQueue.add).toHaveBeenCalledWith('resetPassword', {
      email: sample.email,
      resetPasswordKey: sample.token,
    });
  });

  it('should add a changed-password email to the queue', async () => {
    await service.sendChangedPasswordEmail(sample.email);

    expect(mockQueue.add).toHaveBeenCalledWith('changedPassword', {
      email: sample.email,
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
