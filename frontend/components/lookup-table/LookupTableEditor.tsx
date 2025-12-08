'use client'

import { Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

export interface LookupTableData {
  tempRanges: number[]
  humidityRanges: number[]
  values: number[][]
}

export interface LookupTable {
  id: string
  name: string
  description?: string | null
  commodityTypeId: string
  data: LookupTableData
}

interface LookupTableEditorProps {
  tableData: LookupTable
  onChange: (table: LookupTable) => void
  highlightedCell?: { rowIndex: number; colIndex: number } | null
}

export function LookupTableEditor({ tableData, onChange, highlightedCell }: LookupTableEditorProps) {
  const { data } = tableData

  function addColumnAt(index: number, position: 'before' | 'after') {
    const insertIndex = position === 'before' ? index : index + 1
    const newTemp = data.tempRanges[index] + (position === 'before' ? -5 : 5)

    onChange({
      ...tableData,
      data: {
        ...data,
        tempRanges: [
          ...data.tempRanges.slice(0, insertIndex),
          newTemp,
          ...data.tempRanges.slice(insertIndex),
        ],
        values: data.values.map((row) => [
          ...row.slice(0, insertIndex),
          0,
          ...row.slice(insertIndex),
        ]),
      },
    })
  }

  function removeColumn(index: number) {
    if (data.tempRanges.length <= 1) return
    onChange({
      ...tableData,
      data: {
        ...data,
        tempRanges: data.tempRanges.filter((_, i) => i !== index),
        values: data.values.map((row) => row.filter((_, i) => i !== index)),
      },
    })
  }

  function addRowAt(index: number, position: 'above' | 'below') {
    const insertIndex = position === 'above' ? index : index + 1
    const newHumidity = data.humidityRanges[index] + (position === 'above' ? -10 : 10)

    onChange({
      ...tableData,
      data: {
        ...data,
        humidityRanges: [
          ...data.humidityRanges.slice(0, insertIndex),
          newHumidity,
          ...data.humidityRanges.slice(insertIndex),
        ],
        values: [
          ...data.values.slice(0, insertIndex),
          Array(data.tempRanges.length).fill(0),
          ...data.values.slice(insertIndex),
        ],
      },
    })
  }

  function removeRow(index: number) {
    if (data.humidityRanges.length <= 1) return
    onChange({
      ...tableData,
      data: {
        ...data,
        humidityRanges: data.humidityRanges.filter((_, i) => i !== index),
        values: data.values.filter((_, i) => i !== index),
      },
    })
  }

  function updateTempRange(index: number, value: string) {
    const newRanges = [...data.tempRanges]
    newRanges[index] = parseFloat(value) || 0
    onChange({ ...tableData, data: { ...data, tempRanges: newRanges } })
  }

  function updateHumidityRange(index: number, value: string) {
    const newRanges = [...data.humidityRanges]
    newRanges[index] = parseFloat(value) || 0
    onChange({ ...tableData, data: { ...data, humidityRanges: newRanges } })
  }

  function updateCellValue(rowIndex: number, colIndex: number, value: string) {
    const newValues = data.values.map((row, rIdx) =>
      row.map((cell, cIdx) =>
        rIdx === rowIndex && cIdx === colIndex ? parseFloat(value) || 0 : cell
      )
    )
    onChange({ ...tableData, data: { ...data, values: newValues } })
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-2">
              <div className="w-20 h-8 flex items-center justify-center text-xs text-muted-foreground font-normal">
                Hum \ Temp
              </div>
            </th>
            {data.tempRanges.map((temp, colIndex) => (
              <th key={colIndex} className="relative group">
                <button
                  onClick={() => addColumnAt(colIndex, 'before')}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm z-10"
                  title="Add column before"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => addColumnAt(colIndex, 'after')}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm z-10"
                  title="Add column after"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                {data.tempRanges.length > 1 && (
                  <button
                    onClick={() => removeColumn(colIndex)}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm z-10"
                    title="Remove column"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
                <div className="flex items-center justify-center m-1">
                  <input
                    type="number"
                    value={temp}
                    onChange={(e) => updateTempRange(colIndex, e.target.value)}
                    className="w-16 px-2 py-1.5 bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center rounded-lg text-sm"
                  />
                </div>
              </th>
            ))}
            <th className="pl-2">
              <span className="text-blue-500 text-xs font-medium">°C</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.values.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th className="relative group">
                <button
                  onClick={() => addRowAt(rowIndex, 'above')}
                  className="absolute left-1/2 -translate-x-1/2 -top-2 w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm z-10"
                  title="Add row above"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => addRowAt(rowIndex, 'below')}
                  className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm z-10"
                  title="Add row below"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                {data.humidityRanges.length > 1 && (
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm z-10"
                    title="Remove row"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
                <div className="flex items-center justify-center m-1">
                  <input
                    type="number"
                    value={data.humidityRanges[rowIndex]}
                    onChange={(e) => updateHumidityRange(rowIndex, e.target.value)}
                    className="w-16 px-2 py-1.5 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center rounded-lg text-sm"
                  />
                </div>
              </th>
              {row.map((cell, colIndex) => {
                const isHighlighted =
                  highlightedCell?.rowIndex === rowIndex &&
                  highlightedCell?.colIndex === colIndex
                return (
                  <td key={colIndex}>
                    <input
                      type="number"
                      step="0.1"
                      value={cell}
                      onChange={(e) => updateCellValue(rowIndex, colIndex, e.target.value)}
                      className={`w-16 px-2 py-1.5 border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-center rounded-lg m-0.5 text-sm transition-all ${
                        isHighlighted
                          ? 'bg-amber-500/20 border-amber-400 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-400/50'
                          : 'border-border bg-background'
                      }`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <td className="pt-2">
              <span className="text-emerald-500 text-xs font-medium">%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
