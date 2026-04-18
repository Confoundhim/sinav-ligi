import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum CheatReportType {
  TAB_SWITCH = 'TAB_SWITCH',
  FULLSCREEN_EXIT = 'FULLSCREEN_EXIT',
  COPY_PASTE = 'COPY_PASTE',
  SUSPICIOUS_TIMING = 'SUSPICIOUS_TIMING',
}

export class CheatReportDto {
  @ApiProperty({
    enum: CheatReportType,
    description: 'Kopya türü',
    example: CheatReportType.TAB_SWITCH,
  })
  @IsEnum(CheatReportType)
  type!: CheatReportType;
}
