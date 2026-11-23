import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister ses catégories' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.categories.findAll(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une catégorie' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une catégorie' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer une catégorie non utilisée' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categories.remove(user.sub, id);
  }
}
