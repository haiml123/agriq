import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CommodityLegend } from './commodity-legend';
import type { ChartDataPoint, CommodityMarker } from '../types';

interface HumidityChartProps {
  data: ChartDataPoint[];
  humidityMin: number;
  humidityMax: number;
  commodityMarkers: CommodityMarker[];
}

export function HumidityChart({
  data,
  humidityMin,
  humidityMax,
  commodityMarkers,
}: HumidityChartProps) {
  const t = useTranslations('sites');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('humidityTrends')}</CardTitle>
        <CardDescription>{t('humidityLabel')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#9CA3AF"
              domain={[humidityMin, humidityMax]}
              label={{
                value: '%',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#9CA3AF' },
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#E5E7EB' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg">
                      <p className="text-gray-200 text-sm font-medium">{data.date}</p>
                      <p className="text-blue-400 text-sm">
                        {t('humidityLabel')}: {data.humidity}%
                      </p>
                      <p className="text-amber-400 text-sm font-semibold">
                        {t('commodityLabel')}: {data.commodity}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />

            {/* Commodity change markers */}
            {commodityMarkers.map((marker, idx) => (
              <ReferenceLine
                key={`marker-${idx}-${marker.commodity}`}
                x={marker.date}
                stroke={marker.color}
                strokeWidth={4}
                strokeDasharray="6 3"
                opacity={1}
                ifOverflow="extendDomain"
                label={{
                  value: '▼',
                  position: 'top',
                  fill: marker.color,
                  fontSize: 16,
                }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6' }}
              name={t('humidityLabel')}
            />
          </LineChart>
        </ResponsiveContainer>

        <CommodityLegend markers={commodityMarkers} />
      </CardContent>
    </Card>
  );
}
