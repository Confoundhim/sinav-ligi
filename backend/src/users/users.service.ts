import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    phone?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findOrCreateSocialUser(data: {
    email: string;
    displayName: string;
    avatar?: string;
    passwordHash: string;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      return existing;
    }
    return this.create(data);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        avatar: dto.avatar,
        city: dto.city,
        school: dto.school,
        phone: dto.phone,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
