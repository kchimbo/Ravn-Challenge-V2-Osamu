import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../../prisma/prima.service';
import { PrismaClient, Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { EmailsService } from '../../emails/services/emails.service';
import { EmailsProcessor } from '../../emails/processors/emails.processor';

describe('UsersService', () => {
  let service: UsersService;
  let email: EmailsService;
  let prisma: DeepMockProxy<PrismaService>;

  const credentials = {
    id: 1,
    email: 'username@example.com',
    password: 'password',
    role: Role.CLIENT,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PrismaService,
        {
          provide: EmailsService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
            sendChangedPasswordEmail: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<UsersService>(UsersService);
    email = module.get<EmailsService>(EmailsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a single user by email', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(credentials);

    await expect(service.findOne(credentials.email)).resolves.toBe(credentials);
  });

  it('should find a user by id', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(credentials);

    await expect(service.getById(1)).resolves.toBe(credentials);
  });

  it('should create a user', async () => {
    prisma.user.create.mockResolvedValueOnce(credentials);

    await expect(
      service.create(credentials.email, credentials.password),
    ).resolves.toBe(credentials);
  });

  it("should create a reset and send an email if it doesn't exist for the current user", async () => {
    prisma.resetToken.findFirst.mockResolvedValueOnce(null);

    await service.createResetKeyForUser(credentials.email);
    expect(prisma.resetToken.create).toHaveBeenCalledWith({
      data: {
        expiresAt: expect.any(Date),
        resetKey: expect.any(String),
        user: {
          connect: {
            email: credentials.email,
          },
        },
      },
    });
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      credentials.email,
      expect.any(String),
    );
  });

  it('should send an email if the reset_key already exist for the current user', async () => {
    prisma.resetToken.findFirst.mockResolvedValueOnce({
      id: 1,
      resetKey: 'existing_key',
      createdAt: new Date(),
      expiresAt: new Date(),
      userId: 1,
    });

    await service.createResetKeyForUser(credentials.email);
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      credentials.email,
      'existing_key',
    );
  });

  it('should update the password of the user', async () => {
    prisma.user.update.mockResolvedValueOnce(credentials);

    await expect(
      service.updatePassword(credentials.id, credentials.password),
    ).resolves.toBe(credentials);
  });
});
