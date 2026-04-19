import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RankingPeriod } from '@prisma/client';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    enum: RankingPeriod,
    default: RankingPeriod.WEEKLY,
    description: 'Sıralama periyodu',
  })
  @IsOptional()
  @IsEnum(RankingPeriod)
  period?: RankingPeriod = RankingPeriod.WEEKLY;

  @ApiPropertyOptional({ description: 'Sınav türü ID' })
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: 'Sayfa numarası',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
