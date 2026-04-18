import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com or +905551234567' })
  @IsString()
  emailOrPhone!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ example: 'device-uuid-123' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
