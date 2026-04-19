import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuarantineAttemptDto {
  @ApiProperty({
    description: 'Deneme sorusu ID (aynı konu tipinden farklı soru)',
  })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    enum: ['A', 'B', 'C', 'D', 'E'],
    description: 'Verilen cevap',
  })
  @IsString()
  @IsIn(['A', 'B', 'C', 'D', 'E'])
  answer!: string;
}
