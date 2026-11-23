import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, Matches, Max } from 'class-validator';

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreateBudgetDto {
  @ApiProperty({ example: 1, description: 'Catégorie de dépense' })
  @Type(() => Number)
  @IsInt({ message: 'La catégorie est invalide.' })
  @IsPositive({ message: 'La catégorie est invalide.' })
  categoryId!: number;

  @ApiProperty({ example: '2026-11' })
  @Matches(MONTH_REGEX, { message: 'Le mois doit être au format AAAA-MM.' })
  month!: string;

  @ApiProperty({ example: 400 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le plafond accepte au maximum 2 décimales.' })
  @IsPositive({ message: 'Le plafond doit être strictement positif.' })
  @Max(9_999_999_999)
  limit!: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le plafond accepte au maximum 2 décimales.' })
  @IsPositive({ message: 'Le plafond doit être strictement positif.' })
  @Max(9_999_999_999)
  limit?: number;
}
