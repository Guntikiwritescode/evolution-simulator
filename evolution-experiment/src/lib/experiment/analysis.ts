import type { ExperimentResults, RunResult } from './runner';
import type { GenerationMetrics } from './metrics';
import { descriptiveStats, type DescriptiveStats } from './statistics';

export interface ChartDataPoint {
  generation: number;
  etMean: number;
  etLower: number;
  etUpper: number;
  gsMean: number;
  gsLower: number;
  gsUpper: number;
}

function getMetricOverGenerations(
  runs: RunResult[],
  phase: 'training' | 'transfer',
  extractor: (m: GenerationMetrics) => number,
): Map<number, number[]> {
  const byGen = new Map<number, number[]>();
  for (const run of runs) {
    const metrics = phase === 'training' ? run.trainingMetrics : run.transferMetrics;
    for (const m of metrics) {
      if (!byGen.has(m.generation)) byGen.set(m.generation, []);
      byGen.get(m.generation)!.push(extractor(m));
    }
  }
  return byGen;
}

export function computeChartData(
  etRuns: RunResult[],
  gsRuns: RunResult[],
  phase: 'training' | 'transfer',
  extractor: (m: GenerationMetrics) => number,
): ChartDataPoint[] {
  const etByGen = getMetricOverGenerations(etRuns, phase, extractor);
  const gsByGen = getMetricOverGenerations(gsRuns, phase, extractor);

  const allGens = new Set([...etByGen.keys(), ...gsByGen.keys()]);
  const sorted = [...allGens].sort((a, b) => a - b);

  return sorted.map(gen => {
    const etStats = descriptiveStats(etByGen.get(gen) || []);
    const gsStats = descriptiveStats(gsByGen.get(gen) || []);
    return {
      generation: gen,
      etMean: etStats.mean,
      etLower: etStats.ci95Lower,
      etUpper: etStats.ci95Upper,
      gsMean: gsStats.mean,
      gsLower: gsStats.ci95Lower,
      gsUpper: gsStats.ci95Upper,
    };
  });
}

export function getFinalMetricValues(
  runs: RunResult[],
  phase: 'training' | 'transfer',
  extractor: (m: GenerationMetrics) => number,
  lastN?: number,
): number[] {
  return runs.map(run => {
    const metrics = phase === 'training' ? run.trainingMetrics : run.transferMetrics;
    if (metrics.length === 0) return 0;
    if (lastN) {
      const slice = metrics.slice(-lastN);
      return slice.reduce((s, m) => s + extractor(m), 0) / slice.length;
    }
    return extractor(metrics[metrics.length - 1]);
  });
}

export function getGeneralizationGap(runs: RunResult[], extractor: (m: GenerationMetrics) => number): number[] {
  return runs.map(run => {
    const trainLast5 = run.trainingMetrics.slice(-5);
    const transferFirst5 = run.transferMetrics.slice(0, 5);
    const trainMean = trainLast5.length > 0
      ? trainLast5.reduce((s, m) => s + extractor(m), 0) / trainLast5.length
      : 0;
    const transferMean = transferFirst5.length > 0
      ? transferFirst5.reduce((s, m) => s + extractor(m), 0) / transferFirst5.length
      : 0;
    return trainMean - transferMean;
  });
}

export function getTraitEvolutionData(runs: RunResult[]): {
  generation: number;
  meanSpeed: number;
  meanSize: number;
  meanSenseRange: number;
}[] {
  const allGens = new Map<number, { speed: number[]; size: number[]; sense: number[] }>();

  for (const run of runs) {
    const all = [...run.trainingMetrics, ...run.transferMetrics.map((m, i) => ({
      ...m,
      generation: run.trainingMetrics.length + i,
    }))];
    for (const m of all) {
      if (!allGens.has(m.generation)) allGens.set(m.generation, { speed: [], size: [], sense: [] });
      const g = allGens.get(m.generation)!;
      g.speed.push(m.meanSpeed);
      g.size.push(m.meanSize);
      g.sense.push(m.meanSenseRange);
    }
  }

  return [...allGens.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gen, data]) => ({
      generation: gen,
      meanSpeed: data.speed.reduce((a, b) => a + b, 0) / data.speed.length,
      meanSize: data.size.reduce((a, b) => a + b, 0) / data.size.length,
      meanSenseRange: data.sense.reduce((a, b) => a + b, 0) / data.sense.length,
    }));
}

export function getTotalComputationSteps(runs: RunResult[]): number {
  let total = 0;
  for (const run of runs) {
    for (const m of run.trainingMetrics) total += m.computationSteps;
    for (const m of run.transferMetrics) total += m.computationSteps;
  }
  return total;
}
