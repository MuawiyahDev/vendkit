import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, type User } from '@repo/database';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SafeUser } from '../users/types.js';
import {
  ACCESS_TOKEN_EXPIRY,
  BCRYPT_ROUNDS,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from './auth.constants.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

export interface RegistrationStatus {
  /** True when someone may create an account from the sign-up screen. */
  open: boolean;
  /** True when the next account becomes the installation administrator. */
  isFirstUser: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const userCount = await this.prisma.client.user.count();
    const isFirstUser = userCount === 0;

    if (!isFirstUser && !this.isPublicRegistrationAllowed()) {
      throw new ForbiddenException(
        'Registration is closed on this installation. Ask an administrator to create your account.',
      );
    }

    const existing = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password,
        role: isFirstUser ? Role.ADMIN : Role.USER,
      },
    });

    return this.issueTokens(user);
  }

  async getRegistrationStatus(): Promise<RegistrationStatus> {
    const userCount = await this.prisma.client.user.count();

    return {
      open: userCount === 0 || this.isPublicRegistrationAllowed(),
      isFirstUser: userCount === 0,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const currentValid = await bcrypt.compare(currentPassword, user.password);

    if (!currentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException(
        'The new password must be different from the current password',
      );
    }

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    });
  }

  async setPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: userId },
        data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
      }),
      this.prisma.client.refreshToken.deleteMany({ where: { userId } }),
    ]);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.client.refreshToken.delete({
      where: { id: stored.id },
    });

    return this.issueTokens(stored.user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.client.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const refreshToken = randomUUID();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.client.refreshToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const accessToken = this.signAccessToken(user);
    const { password: _password, ...safeUser } = user;

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  private signAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role satisfies Role,
      type: 'access' as const,
    };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isPublicRegistrationAllowed(): boolean {
    const value = this.config
      .get<string>('ALLOW_PUBLIC_REGISTRATION')
      ?.trim()
      .toLowerCase();

    return value === 'true' || value === '1' || value === 'yes';
  }
}
