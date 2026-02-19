import type { ExperimentResults, RunResult } from './runner';
import type { GenerationMetrics } from './metrics';
import { descriptiveStats, linearRegression, type DescriptiveStats, type LinearRegressionResult } from './statistics';

export interface ChartDataPoint {
  generation: number;
  etMean: number;
  etLower: number;
  etBand: number;
  gsMean: number;
  gsLower: number;
  gsBand: number;
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

  const allGens = new Set<number>();
  for (const k of etByGen.keys()) allGens.add(k);
  for (const k of gsByGen.keys()) allGens.add(k);
  const sorted = Array.from(allGens).sort((a, b) => a - b);

  return sorted.map(gen => {
    const etStats = descriptiveStats(etByGen.get(gen) || []);
    const gsStats = descriptiveStats(gsByGen.get(gen) || []);
    return {
      generation: gen,
      etMean: etStats.mean,
      etLower: etStats.ci95Lower,
      etBand: Math.max(0, etStats.ci95Upper - etStats.ci95Lower),
      gsMean: gsStats.mean,
      gsLower: gsStats.ci95Lower,
      gsBand: Math.max(0, gsStats.ci95Upper - gsStats.ci95Lower),
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
    const trainLast10 = run.trainingMetrics.slice(-10);
    const transferFirst10 = run.transferMetrics.slice(0, 10);
    const trainMean = trainLast10.length > 0
      ? trainLast10.reduce((s, m) => s + extractor(m), 0) / trainLast10.length
      : 0;
    const transferMean = transferFirst10.length > 0
      ? transferFirst10.reduce((s, m) => s + extractor(m), 0) / transferFirst10.length
      : 0;
    return trainMean - transferMean;
  });
}

export function computeFitnessTrendSlopes(runs: RunResult[], phase: 'training' | 'transfer'): number[] {
  return runs.map(run => {
    const metrics = phase === 'training' ? run.trainingMetrics : run.transferMetrics;
    const values = metrics.map(m => m.meanFoodEaten);
    return linearRegression(values).slope;
  });
}

export function computeRecoveryRate(runs: RunResult[]): number[] {
  return runs.map(run => {
    const tm = run.transferMetrics;
    if (tm.length < 10) return 0;
    const first5 = tm.slice(0, 5).reduce((s, m) => s + m.meanFoodEaten, 0) / 5;
    const last5 = tm.slice(-5).reduce((s, m) => s + m.meanFoodEaten, 0) / 5;
    return first5 > 0 ? (last5 - first5) / first5 : 0;
  });
}

export function getTraitEvolutionData(runs: RunResult[]): {
  generation: number;
  meanSpeed: number;
  meanSize: number;
  meanSenseRange: number;
  meanReach: number;
}[] {
  const allGens = new Map<number, { speed: number[]; size: number[]; sense: number[]; reach: number[] }>();

  for (const run of runs) {
    for (const m of run.trainingMetrics) {
      if (!allGens.has(m.generation)) allGens.set(m.generation, { speed: [], size: [], sense: [], reach: [] });
      const g = allGens.get(m.generation)!;
      g.speed.push(m.meanSpeed);
      g.size.push(m.meanSize);
      g.sense.push(m.meanSenseRange);
      g.reach.push(m.meanReach);
    }

    const trainLen = run.trainingMetrics.length;
    for (let i = 0; i < run.transferMetrics.length; i++) {
      const m = run.transferMetrics[i];
      const gen = trainLen + i;
      if (!allGens.has(gen)) allGens.set(gen, { speed: [], size: [], sense: [], reach: [] });
      const g = allGens.get(gen)!;
      g.speed.push(m.meanSpeed);
      g.size.push(m.meanSize);
      g.sense.push(m.meanSenseRange);
      g.reach.push(m.meanReach);
    }
  }

  return Array.from(allGens.entries())
    .sort(([a], [b]) => a - b)
    .map(([gen, data]) => ({
      generation: gen,
      meanSpeed: data.speed.reduce((a, b) => a + b, 0) / data.speed.length,
      meanSize: data.size.reduce((a, b) => a + b, 0) / data.size.length,
      meanSenseRange: data.sense.reduce((a, b) => a + b, 0) / data.sense.length,
      meanReach: data.reach.reduce((a, b) => a + b, 0) / data.reach.length,
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
