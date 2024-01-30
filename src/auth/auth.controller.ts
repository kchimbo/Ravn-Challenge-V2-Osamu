import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ValidBody } from '../utils/decorators';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';
import { UserDto } from './dto/user.dto';
import { TransformDataInterceptor } from '../utils/transform-data.interceptor';
import { RoleGuard } from './guards/role.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './types/roles.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Login with a set of existing credentials',
  })
  @Post('/login')
  @HttpCode(200)
  async login(@ValidBody() { email, password }: LoginDto) {
    return this.authService.login(email, password);
  }

  @ApiOperation({
    summary: 'Register a new user',
  })
  @Post('/register')
  async register(@ValidBody() { email, password }: RegisterDto) {
    await this.authService.register(email, password);
    return null;
  }

  @ApiOperation({
    summary: 'Get information about the current user',
  })
  @ApiBearerAuth('access_token')
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(new TransformDataInterceptor(UserDto))
  async profile(@GetCurrentUserId() userId: number) {
    return await this.authService.getUser(userId);
  }

  @Get('/manager')
  @Roles(Role.MANAGER)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async managerOnly() {
    return 'managers_only';
  }
}
