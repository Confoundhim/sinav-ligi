import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../common/database/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-cuid-1',
  email: 'test@example.com',
  phone: null,
  passwordHash: 'hashed-password',
  displayName: 'Test User',
  avatar: null,
  city: null,
  school: null,
  role: UserRole.STUDENT,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let prisma: {
    authSession: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    user: { update: jest.Mock };
  };
  let redis: { get: jest.Mock; setex: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    redis = {
      get: jest.fn(),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };
    prisma = {
      authSession: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            findOrCreateSocialUser: jest.fn(),
            updatePassword: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret-value-32-chars-long'),
            getOrThrow: jest
              .fn()
              .mockReturnValue('test-secret-value-32-chars-long'),
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        displayName: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'SecurePass123!',
          displayName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when phone already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByPhone.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'new@example.com',
          password: 'SecurePass123!',
          displayName: 'New User',
          phone: '+905551234567',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid email and password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        emailOrPhone: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ emailOrPhone: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          emailOrPhone: 'notfound@example.com',
          password: 'pass',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is disabled', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({ emailOrPhone: 'test@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete the specific session when deviceId is provided', async () => {
      const result = await service.logout('user-1', 'device-1');

      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deviceId: 'device-1' },
      });
      expect(result.message).toBeDefined();
    });

    it('should delete all sessions when deviceId is not provided', async () => {
      const result = await service.logout('user-1');

      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result.message).toBeDefined();
    });
  });

  describe('forgotPassword', () => {
    it('should return same message when email does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'notfound@example.com',
      });

      expect(result.message).toBeDefined();
      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('should store reset token in Redis when email exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect(result.message).toBeDefined();
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('password_reset:'),
        900,
        mockUser.id,
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException for invalid token', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'NewPass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password and invalidate sessions for valid token', async () => {
      redis.get.mockResolvedValue(mockUser.id);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPass123!',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'new-hashed-password',
      );
      expect(redis.del).toHaveBeenCalledWith('password_reset:valid-token');
      expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });
});
