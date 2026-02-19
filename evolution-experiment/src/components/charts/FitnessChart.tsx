'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }} />
          <Area dataKey="etUpper" stroke="none" fill="#0072B2" fillOpacity={0} stackId="et" />
          <Area dataKey="etLower" stroke="none" fill="#0072B2" fillOpacity={0.12} stackId="et" />
          <Area dataKey="gsUpper" stroke="none" fill="#E69F00" fillOpacity={0} stackId="gs" />
          <Area dataKey="gsLower" stroke="none" fill="#E69F00" fillOpacity={0.12} stackId="gs" />
          <Line type="monotone" dataKey="etMean" name="ET (Evolutionary)" stroke="#0072B2" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="gsMean" name="GS (Grid Search)" stroke="#E69F00" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
