import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createPublicKey, createVerify, randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../common/database/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AppleAuthDto } from './dto/apple-auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayload {
  sub: string;
  deviceId: string;
  type: string;
}

interface AppleJwksResponse {
  keys: AppleJwk[];
}

interface AppleJwk {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
  [key: string]: string;
}

interface AppleJwtHeader {
  kid: string;
  alg: string;
}

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: boolean;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('google.clientId'),
    );
  }

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    if (dto.phone) {
      const existingPhone = await this.usersService.findByPhone(dto.phone);
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      phone: dto.phone,
    });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    await this.redis.setex(`email_verify:${user.id}`, 3600, verificationCode);
    console.log(
      `[AUTH] Email verification code for ${user.email}: ${verificationCode}`,
    );

    const deviceId = randomUUID();
    const tokens = await this.generateTokens(user, deviceId);
    await this.createSession(user.id, deviceId, tokens.refreshToken);
    return tokens;
  }

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const user = dto.emailOrPhone.includes('@')
      ? await this.usersService.findByEmail(dto.emailOrPhone)
      : await this.usersService.findByPhone(dto.emailOrPhone);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const deviceId = dto.deviceId ?? randomUUID();
    const tokens = await this.generateTokens(user, deviceId);
    await this.createSession(
      user.id,
      deviceId,
      tokens.refreshToken,
      ip,
      userAgent,
    );
    return tokens;
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(
        dto.refreshToken,
        { secret: this.configService.getOrThrow<string>('jwt.refreshSecret') },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const session = await this.prisma.authSession.findUnique({
      where: {
        userId_deviceId: { userId: payload.sub, deviceId: dto.deviceId },
      },
      include: { user: true },
    });

    if (!session || session.refreshToken !== dto.refreshToken) {
      throw new UnauthorizedException('Session not found or token mismatch');
    }
    if (session.expiresAt < new Date()) {
      await this.prisma.authSession.delete({
        where: {
          userId_deviceId: { userId: payload.sub, deviceId: dto.deviceId },
        },
      });
      throw new UnauthorizedException('Session expired');
    }
    if (!session.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.prisma.authSession.delete({
      where: {
        userId_deviceId: { userId: payload.sub, deviceId: dto.deviceId },
      },
    });

    const tokens = await this.generateTokens(session.user, dto.deviceId);
    await this.createSession(
      session.user.id,
      dto.deviceId,
      tokens.refreshToken,
      session.ip ?? undefined,
      session.userAgent ?? undefined,
    );
    return tokens;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      const resetToken = randomUUID();
      await this.redis.setex(`password_reset:${resetToken}`, 900, user.id);
      console.log(
        `[AUTH] Password reset token for ${user.email}: ${resetToken}`,
      );
    }
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const userId = await this.redis.get(`password_reset:${dto.token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(userId, passwordHash);
    await this.redis.del(`password_reset:${dto.token}`);
    await this.prisma.authSession.deleteMany({ where: { userId } });
    return { message: 'Password reset successfully' };
  }

  async logout(
    userId: string,
    deviceId?: string,
  ): Promise<{ message: string }> {
    if (deviceId) {
      await this.prisma.authSession.deleteMany({
        where: { userId, deviceId },
      });
    } else {
      await this.prisma.authSession.deleteMany({ where: { userId } });
    }
    return { message: 'Logged out successfully' };
  }

  async googleLogin(
    dto: GoogleAuthDto,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const googleClientId = this.configService.get<string>('google.clientId');
    if (!googleClientId) {
      throw new UnauthorizedException('Google login is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: googleClientId,
    });
    const googlePayload = ticket.getPayload();
    if (!googlePayload?.email) {
      throw new UnauthorizedException('Invalid Google token: missing email');
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 12);
    const user = await this.usersService.findOrCreateSocialUser({
      email: googlePayload.email,
      displayName:
        googlePayload.name ?? googlePayload.email.split('@')[0] ?? 'User',
      avatar: googlePayload.picture,
      passwordHash,
    });
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const deviceId = dto.deviceId ?? randomUUID();
    const tokens = await this.generateTokens(user, deviceId);
    await this.createSession(
      user.id,
      deviceId,
      tokens.refreshToken,
      ip,
      userAgent,
    );
    return tokens;
  }

  async appleLogin(
    dto: AppleAuthDto,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const appleAppId = this.configService.get<string>('apple.appId');
    if (!appleAppId) {
      throw new UnauthorizedException('Apple login is not configured');
    }

    const applePayload = await this.verifyAppleToken(
      dto.identityToken,
      appleAppId,
    );
    if (!applePayload.email) {
      throw new UnauthorizedException('Invalid Apple token: missing email');
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 12);
    const user = await this.usersService.findOrCreateSocialUser({
      email: applePayload.email,
      displayName: applePayload.email.split('@')[0] ?? 'User',
      passwordHash,
    });
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const deviceId = dto.deviceId ?? randomUUID();
    const tokens = await this.generateTokens(user, deviceId);
    await this.createSession(
      user.id,
      deviceId,
      tokens.refreshToken,
      ip,
      userAgent,
    );
    return tokens;
  }

  private async verifyAppleToken(
    identityToken: string,
    audience: string,
  ): Promise<AppleTokenPayload> {
    const response = await fetch('https://appleid.apple.com/auth/keys');
    const jwksData = (await response.json()) as AppleJwksResponse;

    const parts = identityToken.split('.');
    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const sigB64 = parts[2];

    if (!headerB64 || !payloadB64 || !sigB64) {
      throw new UnauthorizedException('Invalid Apple token format');
    }

    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString('utf-8'),
    ) as AppleJwtHeader;

    const jwk = jwksData.keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      throw new UnauthorizedException('Apple public key not found');
    }

    const publicKey = createPublicKey({
      key: jwk as unknown as Parameters<typeof createPublicKey>[0] extends {
        key: infer K;
      }
        ? K
        : never,
      format: 'jwk',
    });

    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(sigB64, 'base64url');
    const verify = createVerify('RSA-SHA256');
    verify.update(signingInput);
    const isValid = verify.verify(publicKey, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Apple token signature');
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8'),
    ) as AppleTokenPayload;

    if (payload.iss !== 'https://appleid.apple.com') {
      throw new UnauthorizedException('Invalid Apple token issuer');
    }
    if (payload.aud !== audience) {
      throw new UnauthorizedException('Invalid Apple token audience');
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Apple token expired');
    }

    return payload;
  }

  private async generateTokens(
    user: User,
    deviceId: string,
  ): Promise<TokenPair> {
    const accessPayload = { sub: user.id, email: user.email, role: user.role };
    const refreshPayload = { sub: user.id, deviceId, type: 'refresh' };

    const accessSecret =
      this.configService.getOrThrow<string>('jwt.accessSecret');
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');
    const accessExpiresIn = (this.configService.get<string>(
      'jwt.accessExpiresIn',
    ) ?? '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (this.configService.get<string>(
      'jwt.refreshExpiresIn',
    ) ?? '7d') as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    deviceId: string,
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.authSession.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId, refreshToken, expiresAt, ip, userAgent },
      update: { refreshToken, expiresAt, ip, userAgent },
    });
  }
}
