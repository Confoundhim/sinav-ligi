import { IsString, IsNotEmpty, IsArray, IsInt, Min, Max, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCustomExamDto {
  @ApiProperty({ description: 'Sınav türü ID (örn. KPSS)' })
  @IsString()
  @IsNotEmpty()
  examTypeId!: string;

  @ApiProperty({
    type: [String],
    description: 'Soru tipi ID listesi (hangi konu tiplerinden soru gelsin)',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  questionTypeIds!: string[];

  @ApiProperty({ description: 'Toplam soru sayısı', minimum: 5, maximum: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(120)
  questionCount!: number;
}
