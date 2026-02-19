'use client';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, Legend, ComposedChart,
} from 'recharts';
import type { ChartDataPoint } from '../../lib/experiment/analysis';

interface FitnessChartProps {
  data: ChartDataPoint[];
  title: string;
  yLabel?: string;
}

export default function FitnessChart({ data, title, yLabel = 'Mean Food Eaten / Agent' }: FitnessChartProps) {
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
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#a3a3a3' }}
          />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            labelStyle={{ color: '#a3a3a3' }}
            formatter={(value: number, name: string) => {
              if (name.includes('Band') || name.includes('Lower')) return [null, null];
              return [value.toFixed(3), name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }}
            payload={[
              { value: 'ET (Evolutionary)', type: 'line', color: '#0072B2' },
              { value: 'GS (Grid Search)', type: 'line', color: '#E69F00' },
            ]}
          />
          {/* ET CI band */}
          <Area type="monotone" dataKey="etLower" stackId="etCI" stroke="none" fill="transparent" />
          <Area type="monotone" dataKey="etBand" stackId="etCI" stroke="none" fill="#0072B2" fillOpacity={0.12} />
          {/* GS CI band */}
          <Area type="monotone" dataKey="gsLower" stackId="gsCI" stroke="none" fill="transparent" />
          <Area type="monotone" dataKey="gsBand" stackId="gsCI" stroke="none" fill="#E69F00" fillOpacity={0.12} />
          {/* Mean lines on top */}
          <Line type="monotone" dataKey="etMean" name="ET" stroke="#0072B2" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="gsMean" name="GS" stroke="#E69F00" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
