'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { routing } from '@/i18n/routing';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { useOrganizationApi } from '@/hooks/use-organization-api';
import { useTranslationApi } from '@/hooks/use-translation-api';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { CommodityType } from '@/schemas/commodity-type.schema';
import type { Organization } from '@/schemas/organization.schema';
import type { CreateTranslationDto, Translation } from '@/schemas/translation.schema';

const DEFAULT_PAGE_SIZE = 100;

type EntityKey = 'commodity_type' | 'organization';
type FieldType = 'name' | 'description';

const ENTITY_FIELDS: Record<EntityKey, FieldType[]> = {
    commodity_type: ['name', 'description'],
    organization: ['name'],
};

type EntityItem = {
    id: string;
    name: string;
    description?: string | null;
};

function buildKey(entityId: string, field: string, locale: string) {
    return `${entityId}::${field}::${locale}`;
}

function mapTranslations(translations: Translation[]) {
    const map: Record<string, string> = {};
    translations.forEach((translation) => {
        map[buildKey(translation.entityId, translation.field, translation.locale)] = translation.text;
    });
    return map;
}

export function TranslationsPage() {
    const t = useTranslations('adminTranslations');
    const { isSuperAdmin, isLoading: isUserLoading } = useCurrentUser();

    const { getList: getCommodityTypes } = useCommodityTypeApi();
    const { getList: getOrganizations } = useOrganizationApi();
    const { getList: getTranslations, upsertMany, isSaving } = useTranslationApi();

    const locales = routing.locales;

    const entityOptions = useMemo(
        () => [
            { key: 'commodity_type', label: t('entityCommodityTypes') },
            { key: 'organization', label: t('entityOrganizations') },
        ],
        [t]
    );

    const [entity, setEntity] = useState<EntityKey>('commodity_type');
    const [field, setField] = useState<FieldType>('name');
    const [items, setItems] = useState<EntityItem[]>([]);
    const [originalMap, setOriginalMap] = useState<Record<string, string>>({});
    const [draftMap, setDraftMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const availableFields = useMemo(() => ENTITY_FIELDS[entity], [entity]);

    const hasChanges = useMemo(() => {
        const keys = new Set([...Object.keys(originalMap), ...Object.keys(draftMap)]);
        for (const key of keys) {
            if ((draftMap[key] ?? '') !== (originalMap[key] ?? '')) {
                return true;
            }
        }
        return false;
    }, [draftMap, originalMap]);

    const loadEntities = useCallback(async (): Promise<EntityItem[]> => {
        switch (entity) {
            case 'commodity_type': {
                const response = await getCommodityTypes();
                const items = response?.data ?? [];
                return items.map((type: CommodityType) => ({
                    id: type.id,
                    name: type.name,
                    description: type.description,
                }));
            }
            case 'organization': {
                const response = await getOrganizations({ limit: DEFAULT_PAGE_SIZE, page: 1 });
                const items = response?.data?.items ?? [];
                return items.map((org: Organization) => ({
                    id: org.id,
                    name: org.name,
                }));
            }
            default:
                return [];
        }
    }, [entity, getCommodityTypes, getOrganizations]);

    const loadData = useCallback(async () => {
        if (!isSuperAdmin) return;
        setIsLoading(true);
        try {
            const [entityItems, translationsResponse] = await Promise.all([
                loadEntities(),
                getTranslations({ entity, field }),
            ]);

            setItems(entityItems);

            const translations = translationsResponse?.data ?? [];
            const mapped = mapTranslations(translations);
            setOriginalMap(mapped);
            setDraftMap(mapped);
        } catch (error) {
            console.error('Failed to load translations:', error);
        } finally {
            setIsLoading(false);
        }
    }, [entity, field, getTranslations, isSuperAdmin, loadEntities]);

    useEffect(() => {
        const fieldOptions = availableFields;
        if (!fieldOptions.includes(field)) {
            setField(fieldOptions[0]);
            return;
        }
        loadData();
    }, [availableFields, field, loadData]);

    const updateDraft = (entityId: string, locale: string, value: string) => {
        const key = buildKey(entityId, field, locale);
        setDraftMap((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        const updates = items
            .flatMap((item) =>
                locales.map((locale) => {
                    const key = buildKey(item.id, field, locale);
                    const current = draftMap[key] ?? '';
                    const original = originalMap[key] ?? '';
                    if (current === original) return null;
                    return {
                        entity,
                        entityId: item.id,
                        field,
                        locale,
                        text: current,
                    } as CreateTranslationDto;
                })
            )
            .filter((item): item is CreateTranslationDto => item !== null);

        if (updates.length === 0) return;

        const response = await upsertMany({ translations: updates });
        if (response?.data) {
            const refreshed = mapTranslations(response.data);
            setOriginalMap((prev) => ({ ...prev, ...refreshed }));
            setDraftMap((prev) => ({ ...prev, ...refreshed }));
        } else {
            await loadData();
        }
    };

    if (!isUserLoading && !isSuperAdmin) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t('noPermission')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    isLoading={isSaving}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    {t('saveChanges')}
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/30">{t('entityLabel')}</Badge>
                <Select value={entity} onValueChange={(value) => setEntity(value as EntityKey)}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder={t('entityPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {entityOptions.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{t('fieldLabel')}</span>
                    <Select value={field} onValueChange={(value) => setField(value as FieldType)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('fieldPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableFields.map((fieldOption) => (
                                <SelectItem key={fieldOption} value={fieldOption}>
                                    {fieldOption === 'name' ? t('fieldName') : t('fieldDescription')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[220px]">{t('entityItem')}</TableHead>
                            {locales.map((locale) => (
                                <TableHead key={locale} className="min-w-[200px]">
                                    {locale.toUpperCase()}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-1">
                                        <span>{item.name}</span>
                                        {field === 'description' && item.description && (
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                        )}
                                    </div>
                                </TableCell>
                                {locales.map((locale) => (
                                    <TableCell key={locale}>
                                        <Input
                                            value={draftMap[buildKey(item.id, field, locale)] ?? ''}
                                            onChange={(event) =>
                                                updateDraft(item.id, locale, event.target.value)
                                            }
                                            placeholder={t('placeholder')}
                                            className="w-full"
                                            disabled={isLoading}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={1 + locales.length}>
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        {t('emptyState')}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
