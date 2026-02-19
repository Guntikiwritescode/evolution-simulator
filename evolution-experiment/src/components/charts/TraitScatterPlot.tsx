'use client';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { Creature } from '../../lib/simulation/creature';

interface TraitScatterPlotProps {
  etCreatures: Creature[];
  gsCreatures: Creature[];
}

export default function TraitScatterPlot({ etCreatures, gsCreatures }: TraitScatterPlotProps) {
  const etData = etCreatures.slice(0, 200).map(c => ({
    speed: c.speed.value,
    senseRange: c.senseRange.value,
  }));

  const gsData = gsCreatures.slice(0, 200).map(c => ({
    speed: c.speed.value,
    senseRange: c.senseRange.value,
  }));

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
      <h3 className="font-serif text-base text-text-primary mb-4">
        Final Generation Trait Distribution
      </h3>
      <p className="text-xs text-text-muted mb-4 font-sans">
        Speed vs Sense Range for agents in the final generation (run 1).
        ET should show a dispersed cloud; GS a tight cluster.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            type="number"
            dataKey="speed"
            name="Speed"
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#737373' }}
            label={{ value: 'Speed', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#a3a3a3' }}
          />
          <YAxis
            type="number"
            dataKey="senseRange"
            name="Sense Range"
            tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#737373' }}
            label={{ value: 'Sense Range', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#a3a3a3' }}
          />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }} />
          <Scatter name="ET" data={etData} fill="#0072B2" fillOpacity={0.6} r={3} />
          <Scatter name="GS" data={gsData} fill="#E69F00" fillOpacity={0.8} r={4} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
