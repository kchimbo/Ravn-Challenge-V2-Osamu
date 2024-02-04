import { Roles } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should set metadata correctly', () => {
    @Roles('manager')
    class SampleController {}

    const roles = Reflect.getMetadata('roles', SampleController);

    expect(roles).toEqual(['manager']);
  });
});
