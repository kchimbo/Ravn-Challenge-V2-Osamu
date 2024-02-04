import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PrismaService } from '../prisma/prima.service';
import { EmailsService } from '../emails/services/emails.service';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [EmailsModule],
  providers: [UsersService, EmailsService, PrismaService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
