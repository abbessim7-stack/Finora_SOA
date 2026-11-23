import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { DatabaseModule } from './database/database.module';
import { ReportsModule } from './reports/reports.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    DatabaseModule,
    AdminModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
