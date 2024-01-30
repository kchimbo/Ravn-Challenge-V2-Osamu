import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const credentials = {
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

  it('login should call authService', async () => {
    await controller.login(credentials);
    expect(authService.login).toHaveBeenCalled();
  });

  it('register should call the authService', async () => {
    await controller.register(credentials);
    expect(authService.register).toHaveBeenCalled();
  });
});
