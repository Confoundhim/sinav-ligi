import { IsString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AnswerQuestionDto {
  @ApiProperty({ description: 'Soru sırası (1-tabanlı)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty({
    enum: ['A', 'B', 'C', 'D', 'E'],
    description: 'Verilen cevap',
  })
  @IsString()
  @IsIn(['A', 'B', 'C', 'D', 'E'])
  answer!: string;

  @ApiPropertyOptional({ description: 'Soruya harcanan süre (saniye)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpent?: number;
}
