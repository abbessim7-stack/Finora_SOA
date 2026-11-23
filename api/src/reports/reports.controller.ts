import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  @ApiQuery({ name: 'month', required: false, example: '2026-11' })
  @ApiOperation({ summary: 'Bilan mensuel : revenus, dépenses, solde, répartition' })
  summary(@CurrentUser() user: JwtPayload, @Query('month') month?: string) {
    return this.reports.summary(user.sub, month);
  }

  @Get('trend')
  @ApiQuery({ name: 'months', required: false, example: 6 })
  @ApiQuery({ name: 'to', required: false, example: '2026-11' })
  @ApiOperation({ summary: 'Évolution des revenus, dépenses et solde' })
  trend(
    @CurrentUser() user: JwtPayload,
    @Query('months') months?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.trend(user.sub, months ? Number(months) : 6, to);
  }
}
