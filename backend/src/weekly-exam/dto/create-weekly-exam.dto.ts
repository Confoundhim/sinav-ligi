import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateWeeklyExamDto {
  @ApiProperty({ description: 'Sınav türü ID (ExamType)' })
  @IsString()
  examTypeId!: string;

  @ApiProperty({ description: 'Sınav başlangıç zamanı (ISO 8601)', example: '2026-04-26T16:30:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ description: 'Minimum katılımcı sayısı (varsayılan: 1000)', default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minParticipants?: number;

  @ApiPropertyOptional({ description: 'Katılım ücreti TL (varsayılan: 100)', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  entryFee?: number;
}
