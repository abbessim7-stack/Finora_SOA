import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TRANSACTION_TYPES, type TransactionType } from '../../categories/dto/category.dto';

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreateTransactionDto {
  @ApiProperty({ example: 'Courses Monoprix', maxLength: 120 })
  @IsString()
  @Length(1, 120, { message: 'Le libellé est obligatoire (120 caractères maximum).' })
  label!: string;

  @ApiProperty({ example: 68.4, description: 'Montant strictement positif, 2 décimales maximum' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le montant accepte au maximum 2 décimales.' })
  @IsPositive({ message: 'Le montant doit être strictement positif.' })
  @Max(9_999_999_999, { message: 'Le montant est trop élevé.' })
  amount!: number;

  @ApiProperty({ enum: TRANSACTION_TYPES, example: 'expense' })
  @IsIn(TRANSACTION_TYPES, { message: 'Le type doit être "income" ou "expense".' })
  type!: TransactionType;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'La catégorie est invalide.' })
  @IsPositive({ message: 'La catégorie est invalide.' })
  categoryId!: number;

  @ApiProperty({ example: '2026-11-08' })
  @Matches(DATE_REGEX, { message: 'La date doit être au format AAAA-MM-JJ.' })
  date!: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'Courses Monoprix' })
  @IsOptional()
  @IsString()
  @Length(1, 120, { message: 'Le libellé est obligatoire (120 caractères maximum).' })
  label?: string;

  @ApiPropertyOptional({ example: 72.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le montant accepte au maximum 2 décimales.' })
  @IsPositive({ message: 'Le montant doit être strictement positif.' })
  @Max(9_999_999_999, { message: 'Le montant est trop élevé.' })
  amount?: number;

  @ApiPropertyOptional({ enum: TRANSACTION_TYPES })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES, { message: 'Le type doit être "income" ou "expense".' })
  type?: TransactionType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La catégorie est invalide.' })
  @IsPositive({ message: 'La catégorie est invalide.' })
  categoryId?: number;

  @ApiPropertyOptional({ example: '2026-11-08' })
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'La date doit être au format AAAA-MM-JJ.' })
  date?: string;
}

export class QueryTransactionsDto {
  @ApiPropertyOptional({ enum: TRANSACTION_TYPES })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ example: '2026-11', description: 'Filtre de période par mois' })
  @IsOptional()
  @Matches(MONTH_REGEX, { message: 'Le mois doit être au format AAAA-MM.' })
  month?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'La date de début est invalide.' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'La date de fin est invalide.' })
  to?: string;

  @ApiPropertyOptional({ example: 'courses' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
