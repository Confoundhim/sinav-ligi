import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class WeeklyExamAnswerDto {
  @ApiProperty({ description: "Soru sırası (1'den başlar)", minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  order!: number;

  @ApiProperty({ description: 'Verilen cevap (A/B/C/D/E)', example: 'A' })
  @IsString()
  @Length(1, 1)
  answer!: string;
}
