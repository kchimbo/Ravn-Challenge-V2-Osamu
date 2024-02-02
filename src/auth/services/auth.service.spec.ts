import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;
  let jwtService: JwtService;
  let prismaService: DeepMockProxy<PrismaService>;

  const databaseCredentials = {
    email: 'user@example.com',
    password: '$2b$12$8jzTt774KccjmERCE2BTHe3bhpT84spEB.ZiQWOPTkn5ZD6RSrgzC',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    userService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("login() should throw an unauthorized exception if the user doesn't exist", async () => {
    await expect(
      service.login(databaseCredentials.email, 'password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login() should throw an unauthorized exception if the password is invalid', async () => {
    jest.spyOn(userService, 'findOne').mockResolvedValue(databaseCredentials);
    await expect(
      service.login(databaseCredentials.email, 'wrong_password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login() should return the access and refresh token if the credentials are valid', async () => {
    jest.spyOn(userService, 'findOne').mockResolvedValue(databaseCredentials);
    jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');
    jest
      .spyOn(jwtService, 'decode')
      .mockReturnValue({ sub: 1, jti: '1', exp: new Date() });

    await expect(
      service.login(databaseCredentials.email, 'secret_password'),
    ).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(prismaService.outstandingToken.create).toHaveBeenCalled();
  });

  it('register() should call the userService', async () => {
    await service.register(
      databaseCredentials.email,
      databaseCredentials.password,
    );
    expect(userService.create).toHaveBeenCalled();
  });
});
