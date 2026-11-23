import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { currentMonth } from '../common/month';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  @ApiQuery({ name: 'month', required: false, example: '2026-11' })
  @ApiOperation({ summary: 'Lister les budgets du mois avec dépensé et reste' })
  list(@CurrentUser() user: JwtPayload, @Query('month') month?: string) {
    return this.budgets.list(user.sub, month ?? currentMonth());
  }

  @Post()
  @ApiOperation({ summary: 'Créer un plafond mensuel' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBudgetDto) {
    return this.budgets.create(user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un plafond' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgets.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un budget' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.budgets.remove(user.sub, id);
  }
}
