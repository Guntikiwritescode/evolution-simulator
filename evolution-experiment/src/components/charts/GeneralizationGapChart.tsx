'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ErrorBar, Cell,
} from 'recharts';
import { descriptiveStats } from '../../lib/experiment/statistics';

interface GeneralizationGapChartProps {
  etGaps: number[];
  gsGaps: number[];
}

export default function GeneralizationGapChart({ etGaps, gsGaps }: GeneralizationGapChartProps) {
  const etStats = descriptiveStats(etGaps);
  const gsStats = descriptiveStats(gsGaps);

  const data = [
    {
      name: 'ET',
      gap: etStats.mean,
      error: etStats.ci95Upper - etStats.mean,
    },
    {
      name: 'GS',
      gap: gsStats.mean,
      error: gsStats.ci95Upper - gsStats.mean,
    },
  ];

  const colors = ['#0072B2', '#E69F00'];

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
      <h3 className="font-serif text-base text-text-primary mb-4">
        Generalization Gap
      </h3>
      <p className="text-xs text-text-muted mb-4 font-sans">
        Mean fitness (last 5 gen Env1) &minus; Mean fitness (first 5 gen Env2).
        Larger values indicate worse generalization.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono', fill: '#a3a3a3' }}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#737373' }}
            label={{ value: 'Fitness Drop', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#a3a3a3' }}
          />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
          />
          <Bar dataKey="gap" name="Generalization Gap" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} fillOpacity={0.8} />)}
            <ErrorBar dataKey="error" width={4} strokeWidth={1.5} stroke="#e5e5e5" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
