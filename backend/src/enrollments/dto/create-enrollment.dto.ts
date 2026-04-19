import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'Sınav türü ID' })
  @IsString()
  @IsNotEmpty()
  examTypeId!: string;

  @ApiPropertyOptional({
    description: 'Kayıt yılı (varsayılan: mevcut yıl)',
    example: 2024,
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  year?: number;
}
