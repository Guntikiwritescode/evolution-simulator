'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface ComputationChartProps {
  etSteps: number;
  gsSteps: number;
  gsSearchEvals: number;
}

export default function ComputationChart({ etSteps, gsSteps, gsSearchEvals }: ComputationChartProps) {
  const data = [
    { name: 'ET (Sim)', steps: etSteps },
    { name: 'GS (Search)', steps: gsSearchEvals },
    { name: 'GS (Sim)', steps: gsSteps },
  ];

  const colors = ['#0072B2', '#D55E00', '#E69F00'];

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
      <h3 className="font-serif text-base text-text-primary mb-4">
        Computational Cost
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#a3a3a3' }}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#737373' }}
            label={{ value: 'Total Steps', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#a3a3a3' }}
            tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)}
          />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            formatter={(v: number) => v.toLocaleString()}
          />
          <Bar dataKey="steps" name="Steps" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
