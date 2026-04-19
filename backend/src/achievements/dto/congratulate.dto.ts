import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CongratulateDto {
  @ApiProperty({
    description: 'Tebrik mesajı',
    example: 'Tebrikler! Harika bir performans!',
  })
  @IsString()
  @IsNotEmpty()
  message: string = '';
}
