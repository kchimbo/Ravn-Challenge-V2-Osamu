import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
            getById: jest.fn(),
            updatePassword: jest.fn(),
            createResetKeyForUser: jest.fn(),
            resetPasswordForUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
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

  it('logout should invalid the token', async () => {
    prismaService.outstandingToken.updateMany.mockResolvedValue({
      count: 1,
    } as any);

    await service.logout(1);
  });

  it('should throw a error if the current password does not match when calling changePassword', async () => {
    jest.spyOn(userService, 'getById').mockResolvedValue({
      password: 'current_password',
      email: 'client@example.com',
    });

    await expect(
      service.changePassword(1, {
        newPassword: 'new_password',
        currentPassword: 'current_password',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should change the password if the current password matches when calling changePassword', async () => {
    prismaService.outstandingToken.updateMany.mockResolvedValue({
      count: 1,
    } as any);
    const password = await bcrypt.hash('current_password', 12);
    jest.spyOn(userService, 'getById').mockResolvedValue({
      password: password,
      email: 'client@example.com',
    });

    await service.changePassword(1, {
      newPassword: 'new_password',
      currentPassword: 'current_password',
    });

    expect(userService.updatePassword).toHaveBeenCalled();
  });

  it('should throw an error if email is missing when calling resetPassword', async () => {
    await expect(service.resetPassword({} as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should call userService when email is supplied to resetPassword', async () => {
    await service.resetPassword({ email: 'client@example.com' } as any);

    expect(userService.createResetKeyForUser).toHaveBeenCalled();
  });

  it('should throw an error if email is missing when calling resetPassword', async () => {
    await expect(service.resetPassword({} as any, 'reset_key')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should call userService when email is supplied to resetPassword', async () => {
    await service.resetPassword(
      {
        newPassword: 'new_password',
      } as any,
      'reset_key',
    );

    expect(userService.resetPasswordForUser).toHaveBeenCalled();
  });

  it('should refresh token', async () => {
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
      sub: 1,
      jti: 'token-id',
    });

    jest.spyOn(jwtService, 'signAsync').mockResolvedValue('my_new_token');

    prismaService.outstandingToken.findMany.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        token: 'token',
        createdAt: new Date(),
        expiresAt: new Date(),
        isDenylisted: false,
        user: {
          role: 'client',
        },
      } as any,
    ]);

    await service.refreshToken('refresh_token');
  });

  it('should throw an error if refresh token is denylisted', async () => {
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
      sub: 1,
      jti: 'token-id',
    });

    jest.spyOn(jwtService, 'signAsync').mockResolvedValue('my_new_token');

    prismaService.outstandingToken.findMany.mockResolvedValue([]);

    await expect(service.refreshToken('refresh_token')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('register() should call the userService', async () => {
    await service.register(
      databaseCredentials.email,
      databaseCredentials.password,
    );
    expect(userService.create).toHaveBeenCalled();
  });
});
