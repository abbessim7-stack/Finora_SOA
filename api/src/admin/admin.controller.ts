import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto, UpdateAdminUserDto } from './admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Statistiques globales et état des services (admin uniquement)' })
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  @ApiOperation({ summary: 'Lister les comptes sans données financières (admin uniquement)' })
  users(@Query() query: AdminUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Modifier le rôle ou le statut d’un compte (admin uniquement)' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.admin.updateUser(id, actor, dto);
  }
}
