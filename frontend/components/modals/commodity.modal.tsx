'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CellSelect, type CellSelectSite } from '@/components/ui/cell-select';
import { useTradeApi } from '@/hooks/use-trade-api';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { useSiteApi } from '@/hooks/use-site-api';
import { useApi } from '@/hooks/use-api';
import type { CreateTradeDto } from '@/schemas/trade.schema';
import type { CommodityType } from '@/schemas/commodity-type.schema';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CommodityModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId?: string;
}

export function CommodityModal({
  open,
  onClose,
  onSuccess,
  organizationId,
}: CommodityModalProps) {
  const t = useTranslations('commodityModal');
  const tCommon = useTranslations('common');
  const tSites = useTranslations('sites');
  const tToast = useTranslations('toast.commodity');

  const { create } = useTradeApi();
  const { getList: getCommodityTypes } = useCommodityTypeApi();
  const { getSites } = useSiteApi();
  const { post } = useApi();

  const [formData, setFormData] = useState<Partial<CreateTradeDto>>({
    siteId: '',
    compoundId: '',
    cellId: '',
    commodityTypeId: '',
    origin: '',
    amountKg: 0,
    tradedAt: new Date().toISOString(),
    notes: '',
    direction: 'IN',
  });

  const [sites, setSites] = useState<CellSelectSite[]>([]);
  const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([]);
  const [compoundFilterId, setCompoundFilterId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [existingCommodity, setExistingCommodity] = useState<{
    commodityTypeId: string;
    commodityTypeName: string;
    availableKg: number;
  } | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);

  // Load sites and commodity types when modal opens
  useEffect(() => {
    if (open) {
      loadSites();
      loadCommodityTypes();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      siteId: '',
      compoundId: '',
      cellId: '',
      commodityTypeId: '',
      origin: '',
      amountKg: 0,
      tradedAt: new Date().toISOString(),
      notes: '',
      direction: 'IN',
    });
    setCompoundFilterId('all');
    setError('');
    setExistingCommodity(null);
    setShowWarning(false);
    setUserConfirmed(false);
  };

  const loadSites = async () => {
    try {
      const response = await getSites();
      setSites(response?.data || []);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

  const loadCommodityTypes = async () => {
    try {
      const response = await getCommodityTypes();
      setCommodityTypes(response?.data?.items || []);
    } catch (err) {
      console.error('Failed to load commodity types:', err);
    }
  };

  const handleSiteChange = (siteId: string) => {
    setFormData({
      ...formData,
      siteId,
      compoundId: '',
      cellId: '',
    });
    setCompoundFilterId('all');
    setExistingCommodity(null);
    setShowWarning(false);
    setUserConfirmed(false);
  };

  const handleCompoundChange = (compoundId: string) => {
    setCompoundFilterId(compoundId);
    setFormData({
      ...formData,
      compoundId: '',
      cellId: '',
    });
    setExistingCommodity(null);
    setShowWarning(false);
    setUserConfirmed(false);
  };

  const handleCellSelection = async (cellIds: string[]) => {
    const cellId = cellIds[0] || '';

    // Find the compound that contains this cell
    const selectedSite = sites.find((s) => s.id === formData.siteId);
    const compound = selectedSite?.compounds?.find((c) =>
      c.cells?.some((cell) => cell.id === cellId)
    );

    if (compound?.id) {
      setCompoundFilterId(compound.id);
    }

    setFormData({
      ...formData,
      cellId,
      compoundId: compound?.id || '',
    });

    // Check if cell already has commodity
    if (cellId) {
      await checkCellInventory(cellId);
    } else {
      setExistingCommodity(null);
      setShowWarning(false);
      setUserConfirmed(false);
    }
  };

  const checkCellInventory = async (cellId: string) => {
    try {
      interface MultipleCellsDetails {
        cells: Array<{ id: string; name: string }>;
        trades: Array<{
          id: string;
          cellId: string;
          amountKg: number;
          direction?: 'IN' | 'OUT';
          commodity: {
            commodityType: {
              id: string;
              name: string;
            } | null;
          };
        }>;
      }

      const response = await post<MultipleCellsDetails>(`/sites/cells/details`, {
        cellIds: [cellId],
        startDate: new Date(0).toISOString(),
        endDate: new Date().toISOString(),
      });

      const trades = response?.data?.trades?.filter(t => t.cellId === cellId) || [];

      // Calculate net inventory
      const inventoryMap = new Map<string, { name: string; net: number }>();

      trades.forEach(trade => {
        const commodityTypeId = trade.commodity?.commodityType?.id;
        const commodityTypeName = trade.commodity?.commodityType?.name || 'Unknown';

        if (!commodityTypeId) return;

        const direction = trade.direction || 'IN';
        const amount = direction === 'IN' ? trade.amountKg : -trade.amountKg;

        if (!inventoryMap.has(commodityTypeId)) {
          inventoryMap.set(commodityTypeId, { name: commodityTypeName, net: 0 });
        }

        const current = inventoryMap.get(commodityTypeId)!;
        current.net += amount;
      });

      // Find commodity with positive inventory
      let existing = null;
      inventoryMap.forEach((value, commodityTypeId) => {
        if (value.net > 0) {
          existing = {
            commodityTypeId,
            commodityTypeName: value.name,
            availableKg: value.net,
          };
        }
      });

      setExistingCommodity(existing);
      setShowWarning(!!existing);
      setUserConfirmed(false);
    } catch (err) {
      console.error('Failed to check cell inventory:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's existing commodity and user hasn't confirmed, show warning
    if (existingCommodity && !userConfirmed) {
      setShowWarning(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.siteId) {
        setError('Site is required');
        return;
      }
      if (!formData.cellId) {
        setError('Cell is required');
        return;
      }
      if (!formData.commodityTypeId) {
        setError('Commodity type is required');
        return;
      }
      if (!formData.amountKg || formData.amountKg <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }

      // If there's existing commodity, transfer it out first
      if (existingCommodity && userConfirmed) {
        const transferOutData: CreateTradeDto = {
          siteId: formData.siteId,
          compoundId: formData.compoundId,
          cellId: formData.cellId,
          commodityTypeId: existingCommodity.commodityTypeId,
          amountKg: existingCommodity.availableKg,
          tradedAt: new Date().toISOString(),
          notes: `Auto-transferred out to make space for new commodity`,
          direction: 'OUT',
        };

        const outResponse = await create(transferOutData);
        if (outResponse.error) {
          setError(`Failed to transfer out existing commodity: ${outResponse.error}`);
          setLoading(false);
          return;
        }
      }

      // Add the new commodity
      const response = await create(formData as CreateTradeDto);

      if (response.error) {
        setError(response.error);
        toast.error(tToast('createError'));
      } else if (response.data) {
        toast.success(tToast('createSuccess'));
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add commodity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Site */}
          <div className="space-y-2">
            <Label htmlFor="siteId">
              {t('site')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.siteId || ''}
              onValueChange={handleSiteChange}
            >
              <SelectTrigger id="siteId" className="w-full">
                <SelectValue placeholder={t('selectSite')} />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compound (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="compoundId">{tSites('compound')}</Label>
            <Select
              value={compoundFilterId}
              onValueChange={handleCompoundChange}
              disabled={!formData.siteId}
            >
              <SelectTrigger id="compoundId" className="w-full">
                <SelectValue placeholder={tSites('allCompounds')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tSites('allCompounds')}</SelectItem>
                {sites
                  .find((site) => site.id === formData.siteId)
                  ?.compounds?.map((compound) => (
                    <SelectItem key={compound.id} value={compound.id}>
                      {compound.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cell Selection (Grouped by Compound) */}
          <div className="space-y-2">
            <Label htmlFor="cellId">
              {t('cell')} <span className="text-red-500">*</span>
            </Label>
            <CellSelect
              sites={sites}
              selectedSiteId={formData.siteId}
              selectedCompoundId={compoundFilterId === 'all' ? undefined : compoundFilterId}
              selectedCellIds={formData.cellId ? [formData.cellId] : []}
              onCellSelectionChange={handleCellSelection}
              multiSelect={false}
              disabled={!formData.siteId}
              placeholder={t('selectCell')}
              className="w-full"
            />
          </div>

          {/* Warning for existing commodity */}
          {showWarning && existingCommodity && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {t('existingCommodityTitle')}
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                    {t('existingCommodityBody', {
                      kg: existingCommodity.availableKg.toLocaleString(),
                      commodity: existingCommodity.commodityTypeName,
                    })}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                    {t('existingCommodityWarning')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowWarning(false);
                        setUserConfirmed(false);
                      }}
                    >
                      {tCommon('cancel')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        setUserConfirmed(true);
                        setShowWarning(false);
                      }}
                    >
                      {t('existingCommodityConfirm')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show confirmation badge when user confirmed */}
          {userConfirmed && existingCommodity && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-300">
                {t('existingCommodityConfirmed', {
                  commodity: existingCommodity.commodityTypeName,
                  kg: existingCommodity.availableKg.toLocaleString(),
                })}
              </p>
            </div>
          )}

          {/* Commodity Type */}
          <div className="space-y-2">
            <Label htmlFor="commodityTypeId">
              {t('commodityType')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.commodityTypeId || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, commodityTypeId: value })
              }
            >
              <SelectTrigger id="commodityTypeId" className="w-full">
                <SelectValue placeholder={t('selectCommodityType')} />
              </SelectTrigger>
              <SelectContent>
                {commodityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin/Source */}
          <div className="space-y-2">
            <Label htmlFor="origin">{t('origin')}</Label>
            <Input
              id="origin"
              type="text"
              placeholder={t('originPlaceholder')}
              value={formData.origin || ''}
              onChange={(e) =>
                setFormData({ ...formData, origin: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="amountKg">
              {t('quantityLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amountKg"
              type="number"
              step="0.01"
              min="0"
              placeholder={t('quantityPlaceholder')}
              value={formData.amountKg || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amountKg: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Input
              id="notes"
              type="text"
              placeholder={t('notesPlaceholder')}
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon('creating') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
