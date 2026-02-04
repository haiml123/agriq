'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { CellSelect, type CellSelectSite } from '@/components/select/cell-select';
import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTradeApi } from '@/hooks/use-trade-api';
import { useSiteApi } from '@/hooks/use-site-api';
import { useApi } from '@/hooks/use-api';
import { useTranslationMap } from '@/hooks/use-translation-map';
import type { CreateTradeDto, ApiTrade } from '@/schemas/trade.schema';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { resolveLocaleText } from '@/utils/locale';

interface CellInventory {
  commodityTypeId: string;
  commodityTypeName: string;
  availableKg: number;
}

interface TransferOutModalProps {
  onClose: (result?: ApiTrade | null) => void;
}

export function TransferOutModal({ onClose }: TransferOutModalProps) {
  const t = useTranslations('modals.transferOut');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast.commodity');
  const locale = useLocale();
  const resolveCommodityTypeName = useTranslationMap('commodity_type', locale);
  const { create, isCreating } = useTradeApi();
  const { getSites } = useSiteApi();
  const { get, post } = useApi();

  const [formData, setFormData] = useState<Partial<CreateTradeDto>>({
    siteId: '',
    compoundId: '',
    cellId: '',
    commodityTypeId: '',
    amountKg: 0,
    buyer: '',
    notes: '',
    tradedAt: new Date().toISOString(),
    direction: 'OUT',
  });

  const [sites, setSites] = useState<CellSelectSite[]>([]);
  const [cellInventory, setCellInventory] = useState<CellInventory[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [error, setError] = useState<string>('');

  const getCommodityTypeName = (id: string, fallback: string) =>
    resolveCommodityTypeName(id, 'name', fallback);

  // Load sites when component mounts
  useEffect(() => {
    loadSites();
  }, []);

  // Load cell inventory when cell is selected
  useEffect(() => {
    if (formData.cellId) {
      loadCellInventory(formData.cellId);
    } else {
      setCellInventory([]);
      setFormData(prev => ({ ...prev, commodityTypeId: '', amountKg: 0 }));
    }
  }, [formData.cellId]);

  const loadSites = async () => {
    setIsLoadingSites(true);
    try {
      const response = await getSites();
      setSites(response?.data || []);
    } catch (err) {
      console.error('Failed to load sites:', err);
      setError(t('loadDataError'));
    } finally {
      setIsLoadingSites(false);
    }
  };

  const loadCellInventory = async (cellId: string) => {
    setIsLoadingInventory(true);
    setError('');
    try {
      // Use the same endpoint as the sites page - it returns cell details with trades
      interface MultipleCellsDetails {
        cells: Array<{
          id: string;
          name: string;
        }>;
        trades: Array<{
          id: string;
          cellId: string;
          amountKg: number;
          tradedAt: string;
          direction?: 'IN' | 'OUT';
          commodity: {
            id: string;
            name: string;
            origin: string | null;
            commodityType: {
              id: string;
              name: string;
            } | null;
          };
        }>;
      }

      // Use POST endpoint like the sites page does
      const response = await post<MultipleCellsDetails>(`/sites/cells/details`, {
        cellIds: [cellId],
        startDate: new Date(0).toISOString(), // Get all trades from beginning of time
        endDate: new Date().toISOString(),
      });

      if (!response?.data) {
        console.error('No data returned from cell details');
        setError('Failed to load cell inventory');
        setIsLoadingInventory(false);
        return;
      }

      // Filter trades for this specific cell only
      const allTrades = response.data.trades || [];
      const trades = allTrades.filter(trade => trade.cellId === cellId);
      console.log('Loaded trades for cell:', cellId, trades);

      // Calculate net inventory per commodity type
      const inventoryMap = new Map<string, { name: string; net: number }>();

      trades.forEach(trade => {
        const commodityTypeId = trade.commodity?.commodityType?.id;
        const commodityTypeName = commodityTypeId && trade.commodity?.commodityType?.name
          ? getCommodityTypeName(commodityTypeId, trade.commodity.commodityType.name)
          : trade.commodity?.name || 'Unknown';

        if (!commodityTypeId) {
          console.log('Skipping trade without commodityTypeId:', trade);
          return;
        }

        const direction = trade.direction || 'IN'; // Default to IN for backwards compatibility
        const amount = direction === 'IN' ? trade.amountKg : -trade.amountKg;

        if (!inventoryMap.has(commodityTypeId)) {
          inventoryMap.set(commodityTypeId, { name: commodityTypeName, net: 0 });
        }

        const current = inventoryMap.get(commodityTypeId)!;
        current.net += amount;
      });

      console.log('Calculated inventory map:', Array.from(inventoryMap.entries()));

      // Filter to only show commodities with positive inventory
      const inventory: CellInventory[] = [];
      inventoryMap.forEach((value, commodityTypeId) => {
        if (value.net > 0) {
          inventory.push({
            commodityTypeId,
            commodityTypeName: value.name,
            availableKg: value.net,
          });
        }
      });

      console.log('Final inventory:', inventory);

      setCellInventory(inventory);

      // Auto-select the commodity if there's only one (which should always be the case)
      if (inventory.length > 0) {
        setFormData(prev => ({
          ...prev,
          commodityTypeId: inventory[0].commodityTypeId,
        }));
      } else {
        setError('No commodities available in this cell');
        setFormData(prev => ({
          ...prev,
          commodityTypeId: '',
          amountKg: 0,
        }));
      }
    } catch (err) {
      console.error('Failed to load cell inventory:', err);
      setError('Failed to load cell inventory');
    } finally {
      setIsLoadingInventory(false);
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

  const handleSubmit = async () => {
    setError('');

    // Validate required fields
    if (!formData.siteId) {
      setError(t('siteRequiredError'));
      return;
    }
    if (!formData.cellId) {
      setError(t('cellRequiredError'));
      return;
    }
    if (!formData.commodityTypeId) {
      setError(t('commodityTypeRequiredError'));
      return;
    }
    if (!formData.amountKg || formData.amountKg <= 0) {
      setError(t('quantityRequiredError'));
      return;
    }

    // Validate against available inventory
    const selectedInventory = cellInventory.find(
      inv => inv.commodityTypeId === formData.commodityTypeId
    );

    if (!selectedInventory) {
      setError('Selected commodity is not available in this cell');
      return;
    }

    if (formData.amountKg > selectedInventory.availableKg) {
      setError(`Cannot transfer ${formData.amountKg} kg. Only ${selectedInventory.availableKg} kg available.`);
      return;
    }

    // Create the outbound transfer
    const transferData: CreateTradeDto = {
      siteId: formData.siteId,
      compoundId: formData.compoundId,
      cellId: formData.cellId,
      commodityTypeId: formData.commodityTypeId,
      amountKg: formData.amountKg,
      buyer: formData.buyer?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      tradedAt: formData.tradedAt,
      direction: 'OUT',
    };

    const response = await create(transferData);

    if (response?.error) {
      setError(response.error);
      toast.error(tToast('transferOutError'));
    } else if (response?.data) {
      toast.success(tToast('transferOutSuccess'));
      onClose(response.data);
    }
  };

  const selectedInventory = cellInventory.find(
    inv => inv.commodityTypeId === formData.commodityTypeId
  );

  const isValid =
    formData.siteId &&
    formData.cellId &&
    formData.commodityTypeId &&
    formData.amountKg &&
    formData.amountKg > 0 &&
    cellInventory.length > 0;

  const isLoading = isCreating || isLoadingSites || isLoadingInventory;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>
          {t('description')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Site Selection */}
        <div className="space-y-2">
          <Label htmlFor="siteId">
            {t('siteRequired')}
          </Label>
          <Select
            value={formData.siteId || ''}
            onValueChange={handleSiteChange}
            disabled={isLoading}
          >
            <SelectTrigger id="siteId" className="w-full">
              <SelectValue placeholder={t('selectSourceSite')} />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {resolveLocaleText(site.locale, locale, site.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cell Selection */}
        <div className="space-y-2">
          <Label htmlFor="cellId">
            {t('cellRequired')}
          </Label>
          <CellSelect
            sites={sites}
            selectedSiteId={formData.siteId}
            selectedCellIds={formData.cellId ? [formData.cellId] : []}
            onCellSelectionChange={handleCellSelection}
            multiSelect={false}
            disabled={!formData.siteId || isLoading}
            placeholder={t('selectSourceCell')}
            className="w-full"
          />
        </div>

        {/* Commodity Type (readonly - based on cell inventory) */}
        <div className="space-y-2">
          <Label htmlFor="commodityTypeId">
            Commodity in Cell
          </Label>
          {isLoadingInventory ? (
            <div className="flex items-center gap-2 p-2 border rounded">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading inventory...</span>
            </div>
          ) : cellInventory.length === 0 && formData.cellId ? (
            <div className="flex items-center gap-2 p-3 border rounded bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No commodities available in this cell</span>
            </div>
          ) : cellInventory.length > 0 ? (
            <div className="p-3 border rounded bg-muted">
              <div className="flex items-center justify-between">
                <span className="font-medium">{cellInventory[0].commodityTypeName}</span>
                <span className="text-sm text-muted-foreground">
                  {cellInventory[0].availableKg.toLocaleString()} kg available
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 border rounded bg-muted">
              <span className="text-sm text-muted-foreground">Select a cell first</span>
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="amountKg">
            {t('quantityRequired')}
            {selectedInventory && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Available: {selectedInventory.availableKg.toLocaleString()} kg)
              </span>
            )}
          </Label>
          <Input
            id="amountKg"
            type="number"
            step="0.01"
            min="0.01"
            max={selectedInventory?.availableKg}
            placeholder={t('quantityPlaceholder')}
            value={formData.amountKg || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setFormData({
                ...formData,
                amountKg: value,
              });
              setError('');
            }}
            disabled={isLoading || !formData.commodityTypeId}
            className="w-full"
          />
          {formData.amountKg != null && formData.amountKg > 0 && selectedInventory && formData.amountKg > selectedInventory.availableKg && (
            <p className="text-xs text-red-500">
              Exceeds available quantity ({selectedInventory.availableKg.toLocaleString()} kg)
            </p>
          )}
        </div>

        {/* Buyer/Recipient */}
        <div className="space-y-2">
          <Label htmlFor="buyer">
            {t('buyerOptional')} <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="buyer"
            type="text"
            placeholder={t('buyerPlaceholder')}
            value={formData.buyer || ''}
            onChange={(e) =>
              setFormData({ ...formData, buyer: e.target.value })
            }
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            {t('notesOptional')} <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="notes"
            type="text"
            placeholder={t('notesPlaceholder')}
            value={formData.notes || ''}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onClose()} disabled={isLoading}>
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="bg-amber-500 hover:bg-amber-600"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('transferring')}
            </>
          ) : (
            t('transferButton')
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
