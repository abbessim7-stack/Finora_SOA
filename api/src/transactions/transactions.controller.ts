import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { CreateTransactionDto, QueryTransactionsDto, UpdateTransactionDto } from './dto/transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister ses transactions (filtres et pagination)' })
  list(@CurrentUser() user: JwtPayload, @Query() query: QueryTransactionsDto) {
    return this.transactions.list(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lire une transaction' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.transactions.findOne(user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une transaction' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une transaction' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactions.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer une transaction' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.transactions.remove(user.sub, id);
  }
}
