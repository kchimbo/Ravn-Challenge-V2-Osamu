import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { accessToken, refreshToken } = await this.getJwtTokens(user.id);
    return {
      accessToken,
      refreshToken,
    };
  }

  async register(email: string, password: string) {
    return await this.usersService.create(email, password);
  }

  private async validateUser(
    email: string,
    unhashedPassword: string,
  ): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user) {
      const { password, ...result } = user;
      const isMatch = await bcrypt.compare(unhashedPassword, password);
      return isMatch ? result : null;
    }
    return null;
  }

  private async getJwtTokens(userId: number) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          jti: uuidv4(),
        },
        {
          secret: this.configService.get<string>('auth.accessTokenSecret'),
          expiresIn: '15min',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          jti: uuidv4(),
        },
        {
          secret: this.configService.get<string>('auth.accessTokenSecret'),
          expiresIn: '7d',
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }
}
