'use client'

import { useState, useMemo, useEffect } from 'react'
import type { LookupTableData } from './LookupTableEditor'

interface LookupResult {
  value: number
  tempRange: number
  humidityRange: number
  rowIndex: number
  colIndex: number
}

interface TestLookupProps {
  tableData: LookupTableData
  onLookupChange?: (result: LookupResult | null) => void
}

export function TestLookup({ tableData, onLookupChange }: TestLookupProps) {
  const [inputTemp, setInputTemp] = useState('')
  const [inputHumidity, setInputHumidity] = useState('')

  const lookupResult = useMemo<LookupResult | null>(() => {
    const temp = parseFloat(inputTemp)
    const humidity = parseFloat(inputHumidity)

    if (isNaN(temp) || isNaN(humidity)) return null

    let colIndex = 0
    for (let i = 0; i < tableData.tempRanges.length; i++) {
      if (temp >= tableData.tempRanges[i]) colIndex = i
    }

    let rowIndex = 0
    for (let i = 0; i < tableData.humidityRanges.length; i++) {
      if (humidity >= tableData.humidityRanges[i]) rowIndex = i
    }

    return {
      value: tableData.values[rowIndex][colIndex],
      tempRange: tableData.tempRanges[colIndex],
      humidityRange: tableData.humidityRanges[rowIndex],
      rowIndex,
      colIndex,
    }
  }, [tableData, inputTemp, inputHumidity])

  useEffect(() => {
    onLookupChange?.(lookupResult)
  }, [lookupResult, onLookupChange])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            Temperature
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={inputTemp}
              onChange={(e) => setInputTemp(e.target.value)}
              placeholder="25"
              className="w-20 px-3 py-2 border border-blue-200 dark:border-blue-800 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
            />
            <span className="text-blue-500 text-sm">°C</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            Humidity
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={inputHumidity}
              onChange={(e) => setInputHumidity(e.target.value)}
              placeholder="50"
              className="w-20 px-3 py-2 border border-emerald-200 dark:border-emerald-800 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
            />
            <span className="text-emerald-500 text-sm">%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/30 h-[42px]">
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Result:</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lookupResult ? lookupResult.value : '—'}
          </span>
        </div>
      </div>

      {lookupResult && (
        <p className="text-muted-foreground text-sm">
          Using range: Temp ≥ {lookupResult.tempRange}°C, Humidity ≥ {lookupResult.humidityRange}%
        </p>
      )}
    </div>
  )
}
