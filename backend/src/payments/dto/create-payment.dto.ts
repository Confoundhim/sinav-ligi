import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentType, example: PaymentType.DEPOSIT })
  @IsEnum(PaymentType)
  type!: PaymentType;

  @ApiProperty({ example: 250, description: 'Tutar (TL cinsinden)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999)
  amount!: number;

  @ApiProperty({ example: 'Cüzdan yükleme' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Sınav türü ID (ENROLLMENT tipi için gerekli)',
  })
  @IsOptional()
  @IsString()
  examTypeId?: string;

  @ApiPropertyOptional({
    description: 'Haftalık sınav ID (WEEKLY_EXAM tipi için gerekli)',
  })
  @IsOptional()
  @IsString()
  weeklyExamId?: string;

  @ApiPropertyOptional({
    description: 'Kayıt yılı (ENROLLMENT tipi için gerekli)',
    example: 2024,
  })
  @IsOptional()
  @IsNumber()
  year?: number;
}
