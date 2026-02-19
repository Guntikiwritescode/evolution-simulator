'use client';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Area,
} from 'recharts';
import type { ChartDataPoint } from '../../lib/experiment/analysis';

interface PopulationChartProps {
  data: ChartDataPoint[];
  title: string;
}

export default function PopulationChart({ data, title }: PopulationChartProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
      <h3 className="font-serif text-base text-text-primary mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="generation"
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#737373' }}
            label={{ value: 'Generation', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#a3a3a3' }}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#737373' }}
            label={{ value: 'Population Size', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#a3a3a3' }}
          />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            formatter={(value: number, name: string) => {
              if (name === 'etLower' || name === 'etBand' || name === 'gsLower' || name === 'gsBand') return undefined as any;
              return [typeof value === 'number' ? value.toFixed(1) : value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }}
            payload={[
              { value: 'ET', type: 'line', color: '#0072B2' },
              { value: 'GS', type: 'line', color: '#E69F00' },
            ]}
          />
          <Area type="monotone" dataKey="etLower" stackId="etCI" stroke="none" fill="transparent" />
          <Area type="monotone" dataKey="etBand" stackId="etCI" stroke="none" fill="#0072B2" fillOpacity={0.12} />
          <Area type="monotone" dataKey="gsLower" stackId="gsCI" stroke="none" fill="transparent" />
          <Area type="monotone" dataKey="gsBand" stackId="gsCI" stroke="none" fill="#E69F00" fillOpacity={0.12} />
          <Line type="monotone" dataKey="etMean" name="ET" stroke="#0072B2" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="gsMean" name="GS" stroke="#E69F00" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
