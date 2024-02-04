import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const credentials = {
    id: 1,
    email: 'email@example.com',
    password: 'password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            logout: jest.fn(),
            changePassword: jest.fn(),
            resetPassword: jest.fn(),
            refreshToken: jest.fn(),
            getUser: jest.fn(),
          },
        },
      ],
    })

      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call login', async () => {
    await controller.login(credentials);
    expect(authService.login).toHaveBeenCalled();
  });

  it('should call register', async () => {
    await controller.register(credentials);
    expect(authService.register).toHaveBeenCalled();
  });

  it('should call logout', async () => {
    await controller.logout(credentials.id);
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should call changePassword', async () => {
    await controller.changePassword(credentials.id, {
      currentPassword: 'current_password',
      newPassword: 'new_password',
    });
    expect(authService.changePassword).toHaveBeenCalled();
  });

  it('should change resetPassword', async () => {
    await controller.resetPassword(
      { email: credentials.email, newPassword: credentials.password },
      'reset_key',
    );
    expect(authService.resetPassword).toHaveBeenCalled();
  });

  it('should call refreshToken', async () => {
    await controller.refreshToken({ refreshToken: 'refresh_token' });
    expect(authService.refreshToken).toHaveBeenCalled();
  });

  it('should call getUser [client/manager]', async () => {
    await controller.profile(credentials.id);
    expect(authService.getUser).toHaveBeenCalled();
  });

  it('should call getUser [manager]', async () => {
    await controller.managerOnly(credentials.id);
    expect(authService.getUser).toHaveBeenCalled();
  });
});
