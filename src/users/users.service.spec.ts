import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prima.service';
import { PrismaClient } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  const credentials = {
    id: 1,
    email: 'username@example.com',
    password: 'password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds a single user', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(credentials);

    await expect(service.findOne(credentials.email)).resolves.toBe(credentials);
  });

  it('creates a user', async () => {
    prisma.user.create.mockResolvedValueOnce(credentials);

    await expect(
      service.create(credentials.email, credentials.password),
    ).resolves.toBe(credentials);
  });
});
