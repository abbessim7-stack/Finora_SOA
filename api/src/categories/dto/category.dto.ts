import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export class CreateCategoryDto {
  @ApiProperty({ example: 'Animaux', minLength: 2, maxLength: 40 })
  @IsString()
  @Length(2, 40, { message: 'Le nom doit contenir entre 2 et 40 caractères.' })
  name!: string;

  @ApiProperty({ enum: TRANSACTION_TYPES, example: 'expense' })
  @IsIn(TRANSACTION_TYPES, { message: 'Le type doit être "income" ou "expense".' })
  type!: TransactionType;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Animaux' })
  @IsOptional()
  @IsString()
  @Length(2, 40, { message: 'Le nom doit contenir entre 2 et 40 caractères.' })
  name?: string;

  @ApiPropertyOptional({ enum: TRANSACTION_TYPES })
  @IsOptional()
  @IsIn(TRANSACTION_TYPES, { message: 'Le type doit être "income" ou "expense".' })
  type?: TransactionType;
}
