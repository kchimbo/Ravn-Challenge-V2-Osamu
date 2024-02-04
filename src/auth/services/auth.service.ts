import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prima.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { accessToken, refreshToken } = await this.getJwtTokens(
      user.id,
      user.role,
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async register(email: string, password: string) {
    return await this.usersService.create(email, password);
  }

  async getUser(id: number) {
    return await this.usersService.getById(id);
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

  async changePassword(
    id: number,
    { newPassword, currentPassword }: ChangePasswordDto,
  ) {
    const user = await this.getUser(id);
    if (user) {
      const { password, ...result } = user;
      const isMatch = await bcrypt.compare(currentPassword, password);
      if (isMatch) {
        await this.usersService.updatePassword(id, newPassword);
        await this.logout(id);
        return result;
      }
      throw new BadRequestException(
        "The supplied password doesn't match the current password",
      );
    }
    return null;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, resetKey?: string) {
    if (!resetKey) {
      if (resetPasswordDto.email) {
        return this.usersService.createResetKeyForUser(resetPasswordDto.email);
      } else {
        throw new BadRequestException('Missing email in the body parameters');
      }
    } else {
      if (resetPasswordDto.newPassword) {
        await this.usersService.resetPasswordForUser(
          resetKey,
          resetPasswordDto.newPassword,
        );
      } else {
        throw new BadRequestException(
          'Missing new password in the body parameters',
        );
      }
    }
  }

  async logout(userId: number) {
    const outstandingTokens =
      await this.prismaService.outstandingToken.updateMany({
        where: {
          userId: userId,
        },
        data: {
          isDenylisted: true,
        },
      });
    this.logger.log(
      `Denylisted ${outstandingTokens.count} tokens for user ${userId}`,
    );
    return null;
  }

  async refreshToken(refreshToken: string) {
    try {
      const { sub, jti } = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('auth.refreshTokenSecret'),
      });
      const isActiveToken: any =
        await this.prismaService.outstandingToken.findMany({
          where: {
            token: jti,
            isDenylisted: false,
          },
          include: {
            user: {
              select: {
                role: true,
              },
            },
          },
        });
      if (isActiveToken.length > 0) {
        const newToken = this.jwtService.signAsync(
          {
            sub: sub,
            jti: uuidv4(),
            role: isActiveToken[0].user.role,
          },
          {
            secret: this.configService.get<string>('auth.accessTokenSecret'),
            expiresIn: '150min',
          },
        );
        return { accessTone: newToken };
      } else {
        throw new BadRequestException(
          'The supplied token is valid but has been marked as denylisted',
        );
      }
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        throw new BadRequestException(
          'The supplied refresh token is not valid',
        );
      }
      throw err;
    }
    return null;
  }

  private async getJwtTokens(userId: number, userRole: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          jti: uuidv4(),
          role: userRole,
        },
        {
          secret: this.configService.get<string>('auth.accessTokenSecret'),
          expiresIn: '150min',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          jti: uuidv4(),
        },
        {
          secret: this.configService.get<string>('auth.refreshTokenSecret'),
          expiresIn: '7d',
        },
      ),
    ]);

    const { sub, jti, exp } = this.jwtService.decode(refreshToken);

    await this.prismaService.outstandingToken.create({
      data: {
        userId: sub,
        token: jti,
        expiresAt: new Date(exp * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
