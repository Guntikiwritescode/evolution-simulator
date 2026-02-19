'use client';
import { useState, useEffect } from 'react';
import { Simulation } from '../lib/simulation/simulation';
import { SquareStage } from '../lib/simulation/stage';
import { Interpolator } from '../lib/simulation/interpolator';
import { createCreatureWithTraits, type Creature, type MutatableTrait } from '../lib/simulation/creature';
import { BasicMoveBehaviour } from '../lib/simulation/behaviours/move';
import { WanderBehaviour } from '../lib/simulation/behaviours/wander';
import { CannibalismBehaviour } from '../lib/simulation/behaviours/cannibalism';
import { ScavengeBehaviour } from '../lib/simulation/behaviours/scavenge';
import { SatisfiedBehaviour } from '../lib/simulation/behaviours/satisfied';
import { EdgeHomeBehaviour } from '../lib/simulation/behaviours/edgeHome';
import { StarveBehaviour } from '../lib/simulation/behaviours/starve';
import { collectGenerationMetrics } from '../lib/experiment/metrics';

interface DebugGenData {
  gen: number;
  pop: number;
  meanSpeed: string;
  meanSize: string;
  meanSense: string;
  meanFood: string;
}

export default function DebugPanel() {
  const [isDebug, setIsDebug] = useState(false);
  const [data, setData] = useState<DebugGenData[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsDebug(params.get('debug') === '1');
    }
  }, []);

  if (!isDebug) return null;

  const runDebug = () => {
    setRunning(true);
    setTimeout(() => {
      const stage = new SquareStage(500);
      const foodInterp = new Interpolator([[0, 50]]);
      const sim = new Simulation(stage, '118', foodInterp);

      sim.addBehaviour(new BasicMoveBehaviour());
      sim.addBehaviour(new WanderBehaviour());
      sim.addBehaviour(new CannibalismBehaviour(0.8));
      sim.addBehaviour(new ScavengeBehaviour());
      sim.addBehaviour(new SatisfiedBehaviour());
      sim.addBehaviour(new EdgeHomeBehaviour([]));
      sim.addBehaviour(new StarveBehaviour());

      const trait = (v: number, variance: number): MutatableTrait => ({ value: v, variance });
      const creatures: Creature[] = [];

      for (let i = 0; i < 50; i++) {
        const rawPos = sim.getRandomLocation();
        const pos = stage.getNearestEdgePoint(rawPos);
        creatures.push(createCreatureWithTraits(
          pos,
          trait(10, 0.5),
          trait(10, 0.5),
          trait(20, 0.5),
          trait(1, 0),
          trait(1e12, 0),
          trait(1e4, 0),
          500,
        ));
      }

      sim.run(creatures, 50);

      const results: DebugGenData[] = [];
      for (let i = 0; i < sim.generations.length; i++) {
        const m = collectGenerationMetrics(sim.generations[i], i);
        results.push({
          gen: i,
          pop: m.population,
          meanSpeed: m.meanSpeed.toFixed(2),
          meanSize: m.meanSize.toFixed(2),
          meanSense: m.meanSenseRange.toFixed(2),
          meanFood: m.meanFoodEaten.toFixed(3),
        });
      }

      setData(results);
      setRunning(false);
    }, 50);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 bg-yellow-900/20 border border-yellow-600/30 rounded-lg my-8">
      <h3 className="font-mono text-sm text-yellow-400 mb-4">
        Debug Mode (seed=118, 50 creatures, 50 gen, 500x500 world, 50 food)
      </h3>
      <button
        onClick={runDebug}
        disabled={running}
        className="px-4 py-2 text-xs font-mono bg-yellow-600/20 text-yellow-300 border border-yellow-600/30
          rounded hover:bg-yellow-600/30 disabled:opacity-50"
      >
        {running ? 'Running...' : 'Run Debug Simulation'}
      </button>
      {data.length > 0 && (
        <div className="mt-4 overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-bg-primary">
              <tr className="border-b border-yellow-600/30 text-yellow-400">
                <th className="text-left py-1 px-2">Gen</th>
                <th className="text-right py-1 px-2">Pop</th>
                <th className="text-right py-1 px-2">Speed</th>
                <th className="text-right py-1 px-2">Size</th>
                <th className="text-right py-1 px-2">Sense</th>
                <th className="text-right py-1 px-2">Food/Agent</th>
              </tr>
            </thead>
            <tbody className="text-yellow-200/70">
              {data.map(d => (
                <tr key={d.gen} className="border-b border-yellow-600/10">
                  <td className="py-1 px-2">{d.gen}</td>
                  <td className="text-right py-1 px-2">{d.pop}</td>
                  <td className="text-right py-1 px-2">{d.meanSpeed}</td>
                  <td className="text-right py-1 px-2">{d.meanSize}</td>
                  <td className="text-right py-1 px-2">{d.meanSense}</td>
                  <td className="text-right py-1 px-2">{d.meanFood}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
