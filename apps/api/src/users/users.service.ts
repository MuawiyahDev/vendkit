import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@repo/database';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../auth/auth.constants.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { SAFE_USER_SELECT, type SafeUser } from './types.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SafeUser[]> {
    return this.prisma.client.user.findMany({
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const existing = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    return this.prisma.client.user.create({
      data: {
        email: dto.email,
        name: dto.name?.trim() || null,
        password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        role: dto.role ?? Role.USER,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async assertExists(id: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async updateName(id: string, name: string): Promise<SafeUser> {
    const user = await this.prisma.client.user.update({
      where: { id },
      data: { name },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
