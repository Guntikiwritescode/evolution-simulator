'use client';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, ReferenceLine,
} from 'recharts';

interface DataPoint {
  generation: number;
  meanSpeed: number;
  meanSize: number;
  meanSenseRange: number;
}

interface TraitEvolutionChartProps {
  data: DataPoint[];
  trainingGens: number;
}

export default function TraitEvolutionChart({ data, trainingGens }: TraitEvolutionChartProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
      <h3 className="font-serif text-base text-text-primary mb-4">
        Trait Evolution Over Time (ET Only)
      </h3>
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
            label={{ value: 'Trait Value', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#a3a3a3' }}
          />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }} />
          <ReferenceLine
            x={trainingGens}
            stroke="#555"
            strokeDasharray="5 5"
            label={{ value: 'Env Switch', position: 'top', fill: '#737373', fontSize: 10 }}
          />
          <Line type="monotone" dataKey="meanSpeed" name="Speed" stroke="#0072B2" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="meanSize" name="Size" stroke="#E69F00" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="meanSenseRange" name="Sense Range" stroke="#009E73" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
