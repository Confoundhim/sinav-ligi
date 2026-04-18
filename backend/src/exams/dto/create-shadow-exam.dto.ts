import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShadowExamDto {
  @ApiProperty({ description: 'Sınav türü ID (KPSS dağılımına göre sınav oluşturulur)' })
  @IsString()
  @IsNotEmpty()
  examTypeId!: string;
}
