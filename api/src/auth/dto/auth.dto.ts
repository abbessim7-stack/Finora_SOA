import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Camille Rousseau', minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80, { message: 'Le nom doit contenir entre 2 et 80 caractères.' })
  name!: string;

  @ApiProperty({ example: 'camille@exemple.fr' })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe ne peut pas dépasser 72 caractères.' })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'camille@exemple.fr' })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email!: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(1, { message: 'Le mot de passe est obligatoire.' })
  password!: string;
}

export class UpdateAccountDto {
  @ApiProperty({ example: 'Camille Rousseau', minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80, { message: 'Le nom doit contenir entre 2 et 80 caractères.' })
  name!: string;

  @ApiProperty({ example: 'camille@exemple.fr' })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  @MaxLength(180)
  email!: string;
}
