import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;
  let jwtService: JwtService;

  const databaseCredentials = {
    email: 'user@example.com',
    password: '$2b$12$8jzTt774KccjmERCE2BTHe3bhpT84spEB.ZiQWOPTkn5ZD6RSrgzC',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
    await expect(
      service.login(databaseCredentials.email, 'secret_password'),
    ).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('register() should call the userService', async () => {
    await service.register(
      databaseCredentials.email,
      databaseCredentials.password,
    );
    expect(userService.create).toHaveBeenCalled();
  });
});
