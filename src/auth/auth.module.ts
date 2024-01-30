import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PassportModule, UsersModule],
  providers: [JwtService, AuthService],

  controllers: [AuthController],
})
export class AuthModule {}
