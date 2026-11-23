import { Body, Controller, Delete, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { Public } from '../common/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateAccountDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Créer un compte et recevoir un jeton JWT' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Se connecter' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('activity')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer un battement d’activité du compte connecté' })
  async activity(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.auth.recordActivity(user.sub);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil de l’utilisateur connecté' })
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.profile(user.sub);
  }

  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le profil de l’utilisateur connecté' })
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateAccountDto) {
    return this.auth.updateAccount(user.sub, dto);
  }

  @Delete('me')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer son compte et toutes ses données' })
  async remove(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.auth.deleteAccount(user.sub);
  }
}
