import { Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ValidBody } from '../utils/decorators';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  async login(@ValidBody() { email, password }: LoginDto) {
    return this.authService.login(email, password);
  }

  @Post('/register')
  async register(@ValidBody() { email, password }: RegisterDto) {
    await this.authService.register(email, password);
    return null;
  }
}
