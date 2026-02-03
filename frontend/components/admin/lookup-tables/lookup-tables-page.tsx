'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, Table2, Trash2, Wheat } from 'lucide-react';
import { LookupTableEditor, TestLookup } from '@/components/lookup-table';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { useLookupTableApi } from '@/hooks/use-lookup-table-api';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { DeleteConfirmModal } from '@/components/modals/delete-confirm.modal';
import { CommodityTypeSelect } from '@/components/select/commodity-type-select';
import type { CommodityType } from '@/schemas/commodity-type.schema';
import type { LookupTable, LookupTableData } from '@/schemas/lookup-table.schema';
import { EntityStatusEnum } from '@/schemas/common.schema';

function createDefaultTableData(): LookupTableData {
    return {
        tempRanges: [10, 20, 30, 40],
        humidityRanges: [20, 40, 60, 80],
        values: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
    };
}

export function LookupTablesPage() {
    const modal = useModal();
    const { getList: getCommodityTypes, isLoading: isLoadingCommodityTypes } = useCommodityTypeApi();
    const {
        getByCommodityType,
        create,
        update,
        remove,
        isLoading: isLoadingLookup,
        isSaving,
    } = useLookupTableApi();

    const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [currentTable, setCurrentTable] = useState<LookupTable | null>(null);
    const [highlightedCell, setHighlightedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedType = useMemo(
        () => commodityTypes.find((type) => type.id === selectedTypeId),
        [commodityTypes, selectedTypeId],
    );

    const loadCommodityTypes = useCallback(async () => {
        const response = await getCommodityTypes();
        if (response?.data && Array.isArray(response.data)) {
            setCommodityTypes(response.data);
            if (!selectedTypeId && response.data.length > 0) {
                setSelectedTypeId(response.data[0].id);
            }
        } else {
            setCommodityTypes([]);
        }
    }, [getCommodityTypes, selectedTypeId]);

    useEffect(() => {
        loadCommodityTypes();
    }, [loadCommodityTypes]);

    useEffect(() => {
        const fetchTable = async () => {
            if (!selectedTypeId) {
                setCurrentTable(null);
                return;
            }

            setErrorMessage(null);
            setHighlightedCell(null);
            const response = await getByCommodityType(selectedTypeId);

            if (response?.data) {
                setCurrentTable(response.data);
            } else if (response?.status === 404) {
                setCurrentTable(null);
            } else if (response?.error) {
                setErrorMessage(response.error);
                setCurrentTable(null);
            }
        };

        fetchTable();
    }, [selectedTypeId, getByCommodityType]);

    const handleCreateTable = async () => {
        if (!selectedType) return;

        const response = await create(selectedType.id, {
            name: `${selectedType.name} Storage Table`,
            description: selectedType.description || undefined,
            data: createDefaultTableData(),
        });

        if (response?.data) {
            setCurrentTable(response.data);
            setErrorMessage(null);
        } else if (response?.error) {
            setErrorMessage(response.error);
        }
    };

    const handleUpdateTable = (updatedTable: LookupTable) => {
        setCurrentTable(updatedTable);
    };

    const handleSave = async () => {
        if (!currentTable) return;

        const response = await update(selectedTypeId, {
            name: currentTable.name,
            description: currentTable.description || undefined,
            data: currentTable.data,
        });

        if (response?.data) {
            setCurrentTable(response.data);
        } else if (response?.error) {
            setErrorMessage(response.error);
        }
    };

    const handleDelete = async () => {
        if (!currentTable) return;
        const confirmed = await modal.open<boolean>((onClose) => (
            <DeleteConfirmModal itemType="Lookup Table" itemName={currentTable.name} onClose={onClose} />
        ));
        if (!confirmed) return;
        const response = await remove(selectedTypeId);

        if (!response?.error && response.status >= 200 && response.status < 300) {
            setCurrentTable(null);
            setHighlightedCell(null);
        } else if (response?.error) {
            setErrorMessage(response.error);
        }
    };

    const isTableLoading = isLoadingLookup && Boolean(selectedTypeId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground">Lookup Tables</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure storage lookup tables for each commodity type
                        </p>
                    </div>
                </div>
                {currentTable && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="text-destructive"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Table
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Select Commodity Type
                        </label>
                        <CommodityTypeSelect
                            value={selectedTypeId}
                            onChange={(value) => {
                                setSelectedTypeId(value);
                                setHighlightedCell(null);
                            }}
                            disabled={isLoadingCommodityTypes}
                            commodityTypes={commodityTypes}
                            placeholder="Select a commodity type..."
                            renderItem={({ type, label }) => (
                                <div className="flex items-center gap-2">
                                    <Wheat className="w-4 h-4 text-primary" />
                                    <span>{label}</span>
                                    {type.status !== EntityStatusEnum.ACTIVE && (
                                        <span className="text-xs text-muted-foreground">(inactive)</span>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    {selectedTypeId && !currentTable && !isTableLoading && (
                        <Button onClick={handleCreateTable} className="mt-7" disabled={isSaving}>
                            <Plus className="w-4 h-4 mr-2" />
                            {isSaving ? 'Creating...' : 'Create Table'}
                        </Button>
                    )}
                </div>

                {selectedType && (
                    <p className="text-sm text-muted-foreground mt-3">
                        {selectedType.description || 'No description available'}
                    </p>
                )}
                {errorMessage && <p className="text-sm text-destructive mt-3">{errorMessage}</p>}
            </div>

            {isTableLoading && (
                <div className="bg-surface border border-border rounded-xl p-6 text-sm text-muted-foreground">
                    Loading lookup table...
                </div>
            )}

            {currentTable && !isTableLoading && (
                <>
                    <div className="bg-surface border border-border rounded-xl p-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Table Name
                        </label>
                        <Input
                            value={currentTable.name}
                            onChange={(event) =>
                                handleUpdateTable({ ...currentTable, name: event.target.value })
                            }
                            placeholder="Enter table name..."
                            className="max-w-md"
                        />
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="text-lg font-medium text-foreground mb-2">Edit Values</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Hover over headers to add or remove rows and columns. Blue headers are temperature (°C),
                            green headers are humidity (%).
                        </p>
                        <LookupTableEditor
                            tableData={currentTable}
                            onChange={handleUpdateTable}
                            highlightedCell={highlightedCell}
                        />
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="text-lg font-medium text-foreground mb-2">Test Lookup</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Enter values to test the lookup and see which cell would be selected.
                        </p>
                        <TestLookup tableData={currentTable.data} onLookupChange={setHighlightedCell} />
                    </div>
                </>
            )}

            {!selectedTypeId && (
                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Table2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-1">No commodity type selected</h3>
                    <p className="text-sm text-muted-foreground">
                        Select a commodity type from the dropdown to view or create its lookup table
                    </p>
                </div>
            )}

            {selectedTypeId && !currentTable && !isTableLoading && (
                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Table2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-1">
                        No lookup table for {selectedType?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Click &quot;Create Table&quot; to start configuring storage values
                    </p>
                    <Button onClick={handleCreateTable} disabled={isSaving}>
                        <Plus className="w-4 h-4 mr-2" />
                        {isSaving ? 'Creating...' : 'Create Table'}
                    </Button>
                </div>
            )}
        </div>
    );
}
