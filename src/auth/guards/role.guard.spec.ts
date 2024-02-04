import { RoleGuard } from './role.guard';
import { Reflector } from '@nestjs/core';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    guard = new RoleGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if the user is a manager and the required role is manager', () => {
    const context = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn().mockReturnValue({
          user: {
            role: 'manager',
          },
        }),
      })),
    } as any;

    reflector.get = jest.fn().mockReturnValue(['manager']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if the user is a client and the required role is manager', () => {
    const context = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn().mockReturnValue({
          user: {
            role: 'client',
          },
        }),
      })),
    } as any;

    reflector.get = jest.fn().mockReturnValue(['manager']);
    expect(guard.canActivate(context)).toBe(false);
  });
});
