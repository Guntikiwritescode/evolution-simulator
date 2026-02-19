import type { GenerationMetrics } from '../experiment/metrics';
import type { RunResult } from '../experiment/runner';
import type { GridSearchEntry } from '../experiment/gridSearch';

export function metricsToCSV(runs: RunResult[], phase: 'training' | 'transfer'): string {
  const headers = [
    'run', 'seed', 'generation', 'population', 'meanFoodEaten', 'medianFoodEaten',
    'survivalRate', 'reproductionRate',
    'meanSpeed', 'meanSize', 'meanSenseRange', 'meanReach', 'meanFleeDistance',
    'speedVariance', 'sizeVariance', 'senseRangeVariance', 'reachVariance',
    'traitDiversity', 'shannonDiversity',
    'creaturesEaten', 'energyEfficiency', 'computationSteps',
  ];

  const rows: string[] = [headers.join(',')];

  for (let r = 0; r < runs.length; r++) {
    const metrics = phase === 'training' ? runs[r].trainingMetrics : runs[r].transferMetrics;
    for (const m of metrics) {
      rows.push([
        r + 1, runs[r].seed, m.generation, m.population, m.meanFoodEaten, m.medianFoodEaten,
        m.survivalRate, m.reproductionRate,
        m.meanSpeed, m.meanSize, m.meanSenseRange, m.meanReach, m.meanFleeDistance,
        m.speedVariance, m.sizeVariance, m.senseRangeVariance, m.reachVariance,
        m.traitDiversity, m.shannonDiversity,
        m.creaturesEaten, m.energyEfficiency, m.computationSteps,
      ].join(','));
    }
  }

  return rows.join('\n');
}

export function gridSearchToCSV(entries: GridSearchEntry[]): string {
  const headers = ['speed', 'size', 'senseRange', 'meanFoodEaten', 'populationSurvived'];
  const rows: string[] = [headers.join(',')];
  for (const e of entries) {
    rows.push([e.speed, e.size, e.senseRange, e.meanFoodEaten, e.populationSurvived].join(','));
  }
  return rows.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
