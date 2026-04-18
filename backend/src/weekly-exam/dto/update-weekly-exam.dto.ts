import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateWeeklyExamDto {
  @ApiPropertyOptional({ description: 'Yeni başlangıç zamanı (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Minimum katılımcı sayısı' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minParticipants?: number;

  @ApiPropertyOptional({ description: 'Katılım ücreti TL' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  entryFee?: number;
}
