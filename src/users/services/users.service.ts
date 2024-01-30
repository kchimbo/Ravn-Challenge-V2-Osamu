import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prima.service';
import * as bcrypt from 'bcrypt';

type User = any;
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
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

  async create(email: string, password: string): Promise<User | undefined> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });
  }
}
