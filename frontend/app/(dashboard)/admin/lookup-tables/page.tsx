'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Plus, Save, Table2, Trash2, Wheat } from 'lucide-react'
import { LookupTableEditor, TestLookup } from '@/components/lookup-table'
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api'
import { useLookupTableApi } from '@/hooks/use-lookup-table-api'
import { CommodityType } from '@/schemas/commodity-type.schema'
import { LookupTable, LookupTableData } from '@/schemas/lookup-table.schema'

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
    }
}

export default function LookupTablesPage() {
    const {
        getList: getCommodityTypes,
        isLoading: isLoadingCommodityTypes,
    } = useCommodityTypeApi()
    const {
        getByCommodityType,
        create,
        update,
        remove,
        isLoading: isLoadingLookup,
        isSaving,
        isDeleting,
    } = useLookupTableApi()

    const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([])
    const [selectedTypeId, setSelectedTypeId] = useState<string>('')
    const [currentTable, setCurrentTable] = useState<LookupTable | null>(null)
    const [highlightedCell, setHighlightedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const selectedType = useMemo(
        () => commodityTypes.find((type) => type.id === selectedTypeId),
        [commodityTypes, selectedTypeId]
    )

    const loadCommodityTypes = useCallback(async () => {
        const response = await getCommodityTypes({ limit: 100, isActive: true })
        if (response?.data && Array.isArray(response.data.items)) {
            setCommodityTypes(response.data.items)
        }
    }, [getCommodityTypes])

    useEffect(() => {
        loadCommodityTypes()
    }, [loadCommodityTypes])

    useEffect(() => {
        const fetchTable = async () => {
            if (!selectedTypeId) {
                setCurrentTable(null)
                return
            }

            setErrorMessage(null)
            setHighlightedCell(null)
        const response = await getByCommodityType(selectedTypeId)

            if (response?.data) {
                setCurrentTable(response.data)
            } else if (response?.status === 404) {
                setCurrentTable(null)
            } else if (response?.error) {
                setErrorMessage(response.error)
                setCurrentTable(null)
            }
        }

        fetchTable()
    }, [selectedTypeId, getByCommodityType])

    const handleCreateTable = async () => {
        if (!selectedType) return

        const response = await create(selectedType.id, {
            name: `${selectedType.name} Storage Table`,
            description: selectedType.description || undefined,
            data: createDefaultTableData(),
        })

        if (response?.data) {
            setCurrentTable(response.data)
            setErrorMessage(null)
        } else if (response?.error) {
            setErrorMessage(response.error)
        }
    }

    const handleUpdateTable = (updatedTable: LookupTable) => {
        setCurrentTable(updatedTable)
    }

    const handleSave = async () => {
        if (!currentTable) return

        const response = await update(selectedTypeId, {
            name: currentTable.name,
            description: currentTable.description || undefined,
            data: currentTable.data,
        })

        if (response?.data) {
            setCurrentTable(response.data)
        } else if (response?.error) {
            setErrorMessage(response.error)
        }
    }

    const handleDelete = async () => {
        if (!currentTable) return
        const response = await remove(selectedTypeId)

        if (response?.status === 200) {
            setCurrentTable(null)
            setHighlightedCell(null)
        } else if (response?.error) {
            setErrorMessage(response.error)
        }
    }

    const isTableLoading = isLoadingLookup && !!selectedTypeId

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Lookup Tables</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure storage lookup tables for each commodity type
                    </p>
                </div>
                {currentTable && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={isDeleting || isSaving}
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

            {/* Commodity Type Selector */}
            <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Select Commodity Type
                        </label>
                        <Select
                            value={selectedTypeId}
                            onValueChange={(value) => {
                                setSelectedTypeId(value)
                                setHighlightedCell(null)
                            }}
                            disabled={isLoadingCommodityTypes}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a commodity type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {commodityTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                        <div className="flex items-center gap-2">
                                            <Wheat className="w-4 h-4 text-primary" />
                                            <span>{type.name}</span>
                                            {type.isActive === false && (
                                                <span className="text-xs text-muted-foreground">(inactive)</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                {errorMessage && (
                    <p className="text-sm text-destructive mt-3">{errorMessage}</p>
                )}
            </div>

            {/* Loading State */}
            {isTableLoading && (
                <div className="bg-surface border border-border rounded-xl p-6 text-sm text-muted-foreground">
                    Loading lookup table...
                </div>
            )}

            {/* Table Editor */}
            {currentTable && !isTableLoading && (
                <>
                    {/* Table Name */}
                    <div className="bg-surface border border-border rounded-xl p-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Table Name
                        </label>
                        <Input
                            value={currentTable.name}
                            onChange={(e) =>
                                handleUpdateTable({ ...currentTable, name: e.target.value })
                            }
                            placeholder="Enter table name..."
                            className="max-w-md"
                        />
                    </div>

                    {/* Editor */}
                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="text-lg font-medium text-foreground mb-2">Edit Values</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Hover over headers to add or remove rows and columns. Blue headers are temperature (°C), green headers are humidity (%).
                        </p>
                        <LookupTableEditor
                            tableData={currentTable}
                            onChange={handleUpdateTable}
                            highlightedCell={highlightedCell}
                        />
                    </div>

                    {/* Test Lookup */}
                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="text-lg font-medium text-foreground mb-2">Test Lookup</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Enter values to test the lookup and see which cell would be selected.
                        </p>
                        <TestLookup
                            tableData={currentTable.data}
                            onLookupChange={setHighlightedCell}
                        />
                    </div>
                </>
            )}

            {/* Empty State - No Selection */}
            {!selectedTypeId && (
                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Table2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-1">No commodity type selected</h3>
                    <p className="text-sm text-muted-foreground">
                        Select a commodity type from the dropdown to view or create its lookup table
                    </p>
                </div>
            )}

            {/* Empty State - No Table */}
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
    )
}
