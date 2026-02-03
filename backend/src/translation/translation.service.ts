import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListTranslationsQueryDto, UpsertTranslationsDto } from './dto';

@Injectable()
export class TranslationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListTranslationsQueryDto) {
    const { entity, field, locale, entityIds } = query;

    return this.prisma.translation.findMany({
      where: {
        entity,
        ...(field && { field }),
        ...(locale && { locale }),
        ...(entityIds &&
          entityIds.length > 0 && {
            entityId: { in: entityIds },
          }),
      },
      orderBy: [{ entityId: 'asc' }, { field: 'asc' }, { locale: 'asc' }],
    });
  }

  async upsertMany(dto: UpsertTranslationsDto) {
    const operations = dto.translations.map((translation) =>
      this.prisma.translation.upsert({
        where: {
          entity_entityId_field_locale: {
            entity: translation.entity,
            entityId: translation.entityId,
            field: translation.field,
            locale: translation.locale,
          },
        },
        create: {
          entity: translation.entity,
          entityId: translation.entityId,
          field: translation.field,
          locale: translation.locale,
          text: translation.text,
        },
        update: {
          text: translation.text,
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }
}
