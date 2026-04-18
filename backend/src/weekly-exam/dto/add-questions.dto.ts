import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Sınava soru ekleme DTO'su.
 * İki mod desteklenir:
 *  1. Manuel: `questionIds` listesi gönderilir.
 *  2. Havuzdan otomatik: `questionTypeIds` + `count` gönderilir.
 */
export class AddQuestionsDto {
  @ApiPropertyOptional({
    description: 'Manuel soru ID listesi',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  questionIds?: string[];

  @ApiPropertyOptional({
    description: 'Havuzdan otomatik seçim için soru tipi ID listesi',
    type: [String],
  })
  @ValidateIf(
    (o: AddQuestionsDto) => !o.questionIds || o.questionIds.length === 0,
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  questionTypeIds?: string[];

  @ApiPropertyOptional({ description: 'Havuzdan kaç soru seçilsin' })
  @ValidateIf(
    (o: AddQuestionsDto) => !o.questionIds || o.questionIds.length === 0,
  )
  @IsInt()
  @Min(1)
  @Type(() => Number)
  count?: number;
}
