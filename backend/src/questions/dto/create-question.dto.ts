import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class QuestionChoicesDto {
  @ApiProperty() @IsString() @IsNotEmpty() A!: string;
  @ApiProperty() @IsString() @IsNotEmpty() B!: string;
  @ApiProperty() @IsString() @IsNotEmpty() C!: string;
  @ApiProperty() @IsString() @IsNotEmpty() D!: string;
  @ApiProperty() @IsString() @IsNotEmpty() E!: string;
}

export class QuestionContentDto {
  @ApiProperty({ description: 'Soru metni' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({ type: QuestionChoicesDto })
  @ValidateNested()
  @Type(() => QuestionChoicesDto)
  choices!: QuestionChoicesDto;

  @ApiPropertyOptional({ type: [String], description: 'Görsel URL listesi' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateQuestionDto {
  @ApiProperty({ type: QuestionContentDto, description: 'Soru içeriği' })
  @ValidateNested()
  @Type(() => QuestionContentDto)
  content!: QuestionContentDto;

  @ApiProperty({ enum: ['A', 'B', 'C', 'D', 'E'], description: 'Doğru cevap' })
  @IsString()
  @IsIn(['A', 'B', 'C', 'D', 'E'])
  correctAnswer!: string;

  @ApiProperty({ description: 'Çözüm açıklaması' })
  @IsString()
  @IsNotEmpty()
  explanation!: string;

  @ApiProperty({ description: 'Soru tipi ID' })
  @IsString()
  @IsNotEmpty()
  questionTypeId!: string;

  @ApiPropertyOptional({
    description: 'Zorluk derecesi (1=kolay, 5=zor)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;
}
