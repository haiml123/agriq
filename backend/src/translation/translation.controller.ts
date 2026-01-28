import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { ListTranslationsQueryDto, UpsertTranslationsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { user_role } from '@prisma/client';

@Controller('translations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  findAll(@Query() query: ListTranslationsQueryDto) {
    return this.translationService.findAll(query);
  }

  @Post('bulk')
  @Roles(user_role.SUPER_ADMIN)
  upsertMany(@Body() dto: UpsertTranslationsDto) {
    return this.translationService.upsertMany(dto);
  }
}
