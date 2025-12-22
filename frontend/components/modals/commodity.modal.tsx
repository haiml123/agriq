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
import type { CreateTradeDto } from '@/schemas/trade.schema';
import type { CommodityType } from '@/schemas/commodity-type.schema';

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

  const { create } = useTradeApi();
  const { getList: getCommodityTypes } = useCommodityTypeApi();
  const { getSites } = useSiteApi();

  const [formData, setFormData] = useState<Partial<CreateTradeDto>>({
    siteId: '',
    compoundId: '',
    cellId: '',
    commodityTypeId: '',
    origin: '',
    amountKg: 0,
    tradedAt: new Date().toISOString(),
    notes: '',
  });

  const [sites, setSites] = useState<CellSelectSite[]>([]);
  const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
    });
    setError('');
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
  };

  const handleCellSelection = (cellIds: string[]) => {
    const cellId = cellIds[0] || '';

    // Find the compound that contains this cell
    const selectedSite = sites.find((s) => s.id === formData.siteId);
    const compound = selectedSite?.compounds?.find((c) =>
      c.cells?.some((cell) => cell.id === cellId)
    );

    setFormData({
      ...formData,
      cellId,
      compoundId: compound?.id || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const response = await create(formData as CreateTradeDto);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
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
              Site <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.siteId || ''}
              onValueChange={handleSiteChange}
            >
              <SelectTrigger id="siteId" className="w-full">
                <SelectValue placeholder="Select site" />
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

          {/* Cell Selection (Grouped by Compound) */}
          <div className="space-y-2">
            <Label htmlFor="cellId">
              Cell <span className="text-red-500">*</span>
            </Label>
            <CellSelect
              sites={sites}
              selectedSiteId={formData.siteId}
              selectedCellIds={formData.cellId ? [formData.cellId] : []}
              onCellSelectionChange={handleCellSelection}
              multiSelect={false}
              disabled={!formData.siteId}
              placeholder="Select cell"
              className="w-full"
            />
          </div>

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
              Quantity (kg) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amountKg"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter quantity in kg"
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
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Optional notes"
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
