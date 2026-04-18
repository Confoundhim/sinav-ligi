import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BadgeEvent {
  EXAM_COMPLETED = 'exam_completed',
  DUEL_WON = 'duel_won',
  QUARANTINE_RESCUED = 'quarantine_rescued',
  VIDEO_WATCHED = 'video_watched',
}

export class CheckBadgeDto {
  @ApiProperty({ description: 'Kullanıcı ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: BadgeEvent, description: 'Tetikleyen olay' })
  @IsEnum(BadgeEvent)
  event!: BadgeEvent;

  @ApiPropertyOptional({ description: 'Ek meta veri (examTypeId, betPoints vb.)' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
