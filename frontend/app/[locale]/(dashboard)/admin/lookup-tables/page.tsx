'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Save, Table2, Trash2, Wheat } from 'lucide-react'
import { LookupTableEditor, TestLookup } from '@/components/lookup-table'
import { LookupTable, LookupTableData } from '@/schemas/lookup-table.schema'
import { CommodityType } from '@/schemas/commodity-type.schema'
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api'
import { useLookupTableApi } from '@/hooks/use-lookup-table-api'

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
    const { getList: getCommodityTypes } = useCommodityTypeApi()
    const { getByCommodityType, create, update, remove, isLoading: isLookupLoading, isSaving } = useLookupTableApi()

    const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([])
    const [lookupTables, setLookupTables] = useState<Record<string, LookupTable | null | undefined>>({})
    const [selectedTypeId, setSelectedTypeId] = useState<string>('')
    const [highlightedCell, setHighlightedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
    const [lookupError, setLookupError] = useState<string | null>(null)

    const selectedType = useMemo(
        () => commodityTypes.find((t) => t.id === selectedTypeId),
        [commodityTypes, selectedTypeId],
    )
    const currentTable = selectedTypeId ? lookupTables[selectedTypeId] ?? null : null
    const hasLoadedTable = lookupTables[selectedTypeId] !== undefined

    useEffect(() => {
        const loadCommodityTypes = async () => {
            const response = await getCommodityTypes({ limit: 100 })
            if (response?.data?.items) {
                setCommodityTypes(response.data.items)
                setSelectedTypeId((current) => current || response.data?.items[0]?.id || '')
            }
        }

        loadCommodityTypes()
    }, [getCommodityTypes])

    useEffect(() => {
        setHighlightedCell(null)
    }, [selectedTypeId])

    const fetchLookupTable = useCallback(
        async (commodityTypeId: string) => {
            setLookupError(null)
            const response = await getByCommodityType(commodityTypeId)

            if (response?.data) {
                setLookupTables((prev) => ({ ...prev, [commodityTypeId]: response.data }))
            } else if (response?.status === 404) {
                setLookupTables((prev) => ({ ...prev, [commodityTypeId]: null }))
            } else if (response?.error) {
                setLookupError(response.error)
            }
        },
        [getByCommodityType],
    )

    useEffect(() => {
        if (!selectedTypeId) return
        if (lookupTables[selectedTypeId] === undefined) {
            fetchLookupTable(selectedTypeId)
        }
    }, [fetchLookupTable, lookupTables, selectedTypeId])

    const handleCreateTable = async () => {
        if (!selectedTypeId || !selectedType) return
        setLookupError(null)

        const response = await create(selectedTypeId, {
            name: `${selectedType.name} Lookup Table`,
            description: selectedType.description ?? undefined,
            data: createDefaultTableData(),
        })

        if (response?.data) {
            setLookupTables((prev) => ({ ...prev, [selectedTypeId]: response.data }))
        } else if (response?.error) {
            setLookupError(response.error)
        }
    }

    const handleUpdateTable = (updatedTable: LookupTable) => {
        setLookupTables((prev) => ({
            ...prev,
            [updatedTable.commodityTypeId]: updatedTable,
        }))
    }

    const handleSave = async () => {
        if (!currentTable) return
        setLookupError(null)

        const response = await update(currentTable.commodityTypeId, {
            name: currentTable.name,
            description: currentTable.description ?? undefined,
            data: currentTable.data,
        })

        if (response?.data) {
            setLookupTables((prev) => ({
                ...prev,
                [currentTable.commodityTypeId]: response.data,
            }))
        } else if (response?.error) {
            setLookupError(response.error)
        }
    }

    const handleDeleteTable = async () => {
        if (!selectedTypeId) return
        setLookupError(null)

        const response = await remove(selectedTypeId)
        if (response?.status === 200 || response?.status === 204 || response?.data === null) {
            setLookupTables((prev) => ({ ...prev, [selectedTypeId]: null }))
        } else if (response?.error) {
            setLookupError(response.error)
        }
    }

    const isBusy = isLookupLoading || isSaving

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
                        <Button variant="outline" onClick={handleDeleteTable} disabled={isBusy}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Table
                        </Button>
                        <Button onClick={handleSave} disabled={isBusy}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            {lookupError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
                    {lookupError}
                </div>
            )}

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
                                setLookupError(null)
                                setHighlightedCell(null)
                            }}
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
                                            {lookupTables[type.id] && (
                                                <span className="text-xs text-muted-foreground">(has table)</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTypeId && currentTable === null && hasLoadedTable && (
                        <Button onClick={handleCreateTable} className="mt-7" disabled={isBusy}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Creating...' : 'Create Table'}
                        </Button>
                    )}
                </div>

                {selectedType && (
                    <p className="text-sm text-muted-foreground mt-3">
                        {selectedType.description || 'No description available'}
                    </p>
                )}
            </div>

            {/* Loading state */}
            {selectedTypeId && !hasLoadedTable && (
                <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading lookup table...</span>
                    </div>
                </div>
            )}

            {/* Table Editor */}
            {currentTable && (
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
            {selectedTypeId && currentTable === null && hasLoadedTable && (
                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Table2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-1">
                        No lookup table for {selectedType?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Click &#34;Create Table&#34; to start configuring storage values
                    </p>
                    <Button onClick={handleCreateTable} disabled={isBusy}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isSaving ? 'Creating...' : 'Create Table'}
                    </Button>
                </div>
            )}
        </div>
    )
}
