import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChallengeDto {
  @ApiProperty({ description: 'Meydan okunan kullanıcı ID' })
  @IsString()
  @IsNotEmpty()
  opponentId!: string;

  @ApiProperty({ description: 'Sınav türü ID' })
  @IsString()
  @IsNotEmpty()
  examTypeId!: string;

  @ApiProperty({ description: 'Bahis puanı', minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  betPoints!: number;
}

export class MatchmakingDto {
  @ApiProperty({ description: 'Sınav türü ID' })
  @IsString()
  @IsNotEmpty()
  examTypeId!: string;

  @ApiProperty({ description: 'Bahis puanı', minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  betPoints!: number;
}
