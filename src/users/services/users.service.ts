import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { EmailsService } from '../../emails/services/emails.service';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../../prisma/prisma.errors';

type User = any;
@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);
  constructor(
    private emailsService: EmailsService,
    private prisma: PrismaService,
  ) {}
  async findOne(email: string): Promise<User | undefined> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async getById(id: number): Promise<User | undefined> {
    return this.prisma.user.findFirst({
      where: {
        id,
      },
    });
  }

  async updatePassword(id: number, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  async create(email: string, password: string): Promise<User | undefined> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });
  }

  async createResetKeyForUser(email: string) {
    const existingKey = await this.prisma.resetToken.findFirst({
      where: {
        user: {
          email,
        },
      },
    });
    console.log(existingKey);
    console.log(`my value...`);
    if (!existingKey) {
      console.log('creating a new key');
      const resetKey = crypto.randomBytes(20).toString('hex');
      try {
        const token = await this.prisma.resetToken.create({
          data: {
            resetKey: resetKey,
            expiresAt: new Date(),
            user: {
              connect: {
                email,
              },
            },
          },
        });
        await this.emailsService.sendPasswordResetEmail(email, resetKey);
        this.logger.log(
          `Created a new reset key and sent an reset password email to user id ${token.userId}`,
        );
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === PrismaError.ModelDoesNotExist
        ) {
          throw new BadRequestException(
            'The supplied email address was not found',
          );
        }
      }
    } else {
      await this.emailsService.sendPasswordResetEmail(
        email,
        existingKey.resetKey,
      );
      this.logger.log(
        `Skipped token creation since an active token already exists for user id ${existingKey.userId}`,
      );
      this.logger.log(
        `Sending password reset email to user id ${existingKey.userId}`,
      );
    }
    return null;
  }

  async resetPasswordForUser(resetKey: string, newPassword: string) {
    try {
      const {
        id,
        userId,
        user: { email },
      } = await this.prisma.resetToken.findUniqueOrThrow({
        where: {
          resetKey,
        },
        include: {
          user: true,
        },
      });

      const password = await bcrypt.hash(newPassword, 12);
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password,
        },
      });
      await this.prisma.resetToken.delete({
        where: {
          id: id,
        },
      });
      await this.emailsService.sendChangedPasswordEmail(email);
    } catch (err) {
      console.log(err);
    }
  }
}
