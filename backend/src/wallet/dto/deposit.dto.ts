import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: 100, description: 'Yüklenecek tutar (TL)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999)
  amount!: number;
}
