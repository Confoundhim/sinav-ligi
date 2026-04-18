import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Device ID to logout from. If omitted, all sessions are cleared.',
    example: 'device-uuid-123',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
