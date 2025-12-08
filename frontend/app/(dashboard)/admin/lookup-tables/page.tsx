'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Plus, Save, Table2, Wheat } from 'lucide-react'
import type { LookupTable } from '@/components/lookup-table'
import { LookupTableEditor, TestLookup } from '@/components/lookup-table'

// Mock data - replace with API calls
interface CommodityType {
    id: string
    name: string
    description?: string | null
    isActive: boolean
}

const mockCommodityTypes: CommodityType[] = [
    { id: '1', name: 'Wheat', description: 'Winter and spring wheat varieties', isActive: true },
    { id: '2', name: 'Corn', description: 'Yellow and white corn', isActive: true },
    { id: '3', name: 'Soybeans', description: 'Various soybean cultivars', isActive: true },
    { id: '4', name: 'Barley', description: 'Malting and feed barley', isActive: true },
]

const mockLookupTables: Record<string, LookupTable> = {
    '1': {
        id: 't1',
        name: 'Wheat Storage Table',
        commodityTypeId: '1',
        data: {
            tempRanges: [10, 20, 30, 40],
            humidityRanges: [20, 40, 60, 80],
            values: [
                [1.2, 1.5, 1.8, 2.1],
                [2.3, 2.7, 3.1, 3.5],
                [3.4, 3.9, 4.4, 4.9],
                [4.5, 5.1, 5.7, 6.3],
            ],
        },
    },
    '2': {
        id: 't2',
        name: 'Corn Storage Table',
        commodityTypeId: '2',
        data: {
            tempRanges: [15, 25, 35, 45],
            humidityRanges: [30, 50, 70, 90],
            values: [
                [0.8, 1.1, 1.4, 1.7],
                [1.5, 1.9, 2.3, 2.7],
                [2.2, 2.7, 3.2, 3.7],
                [2.9, 3.5, 4.1, 4.7],
            ],
        },
    },
}

function createDefaultTable(commodityTypeId: string, commodityName: string): LookupTable {
    return {
        id: Date.now().toString(),
        name: `${commodityName} Storage Table`,
        commodityTypeId,
        data: {
            tempRanges: [10, 20, 30, 40],
            humidityRanges: [20, 40, 60, 80],
            values: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
        },
    }
}

export default function LookupTablesPage() {
    const [commodityTypes] = useState<CommodityType[]>(mockCommodityTypes)
    const [lookupTables, setLookupTables] = useState<Record<string, LookupTable>>(mockLookupTables)
    const [selectedTypeId, setSelectedTypeId] = useState<string>('')
    const [highlightedCell, setHighlightedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const selectedType = commodityTypes.find((t) => t.id === selectedTypeId)
    const currentTable = selectedTypeId ? lookupTables[selectedTypeId] : null

    const handleCreateTable = () => {
        if (!selectedTypeId || !selectedType) return
        const newTable = createDefaultTable(selectedTypeId, selectedType.name)
        setLookupTables({ ...lookupTables, [selectedTypeId]: newTable })
    }

    const handleUpdateTable = (updatedTable: LookupTable) => {
        setLookupTables({
            ...lookupTables,
            [updatedTable.commodityTypeId]: updatedTable,
        })
    }

    const handleSave = async () => {
        if (!currentTable) return
        setIsSaving(true)
        // TODO: Replace with actual API call
        console.log('Saving table:', currentTable)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setIsSaving(false)
    }

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
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
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

                    {selectedTypeId && !currentTable && (
                        <Button onClick={handleCreateTable} className="mt-7">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Table
                        </Button>
                    )}
                </div>

                {selectedType && (
                    <p className="text-sm text-muted-foreground mt-3">
                        {selectedType.description || 'No description available'}
                    </p>
                )}
            </div>

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
            {selectedTypeId && !currentTable && (
                <div className="bg-surface border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Table2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-1">
                        No lookup table for {selectedType?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Click &#34;Create Table&#34; to start configuring storage values
                    </p>
                    <Button onClick={handleCreateTable}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Table
                    </Button>
                </div>
            )}
        </div>
    )
}
