'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ExperimentResults } from '../lib/experiment/runner';
import {
  computeChartData,
  getFinalMetricValues,
  getGeneralizationGap,
  getTraitEvolutionData,
  getTotalComputationSteps,
} from '../lib/experiment/analysis';
import { compareConditions } from '../lib/experiment/statistics';
import FitnessChart from './charts/FitnessChart';
import PopulationChart from './charts/PopulationChart';
import DiversityChart from './charts/DiversityChart';
import TraitEvolutionChart from './charts/TraitEvolutionChart';
import GeneralizationGapChart from './charts/GeneralizationGapChart';
import TraitScatterPlot from './charts/TraitScatterPlot';
import ComputationChart from './charts/ComputationChart';
import StatisticsTable from './StatisticsTable';

interface ResultsDashboardProps {
  results: ExperimentResults;
}

export default function ResultsDashboard({ results }: ResultsDashboardProps) {
  const analysis = useMemo(() => {
    const { etRuns, gsRuns, config } = results;

    const fitnessTraining = computeChartData(etRuns, gsRuns, 'training', m => m.meanFoodEaten);
    const fitnessTransfer = computeChartData(etRuns, gsRuns, 'transfer', m => m.meanFoodEaten);
    const popTraining = computeChartData(etRuns, gsRuns, 'training', m => m.population);
    const popTransfer = computeChartData(etRuns, gsRuns, 'transfer', m => m.population);
    const divTraining = computeChartData(etRuns, gsRuns, 'training', m => m.traitDiversity);
    const divTransfer = computeChartData(etRuns, gsRuns, 'transfer', m => m.traitDiversity);

    const traitEvolution = getTraitEvolutionData(etRuns);

    const etFinalFitness = getFinalMetricValues(etRuns, 'training', m => m.meanFoodEaten);
    const gsFinalFitness = getFinalMetricValues(gsRuns, 'training', m => m.meanFoodEaten);
    const etTransferFitness = getFinalMetricValues(etRuns, 'transfer', m => m.meanFoodEaten, 5);
    const gsTransferFitness = getFinalMetricValues(gsRuns, 'transfer', m => m.meanFoodEaten, 5);
    const etGap = getGeneralizationGap(etRuns, m => m.meanFoodEaten);
    const gsGap = getGeneralizationGap(gsRuns, m => m.meanFoodEaten);
    const etDiversity = getFinalMetricValues(etRuns, 'training', m => m.traitDiversity);
    const gsDiversity = getFinalMetricValues(gsRuns, 'training', m => m.traitDiversity);

    const etSteps = getTotalComputationSteps(etRuns);
    const gsSteps = getTotalComputationSteps(gsRuns);
    const gsSearchEvals = results.gridSearchResult.entries.length;

    const etStepsArr = etRuns.map(r => {
      let s = 0;
      for (const m of r.trainingMetrics) s += m.computationSteps;
      for (const m of r.transferMetrics) s += m.computationSteps;
      return s;
    });
    const gsStepsArr = gsRuns.map(r => {
      let s = 0;
      for (const m of r.trainingMetrics) s += m.computationSteps;
      for (const m of r.transferMetrics) s += m.computationSteps;
      return s;
    });

    const statRows = [
      { metric: 'Final training fitness', result: compareConditions(etFinalFitness, gsFinalFitness) },
      { metric: 'Transfer fitness (gen 1-5)', result: compareConditions(etTransferFitness, gsTransferFitness) },
      { metric: 'Generalization gap', result: compareConditions(etGap, gsGap) },
      { metric: 'Final trait diversity', result: compareConditions(etDiversity, gsDiversity) },
      { metric: 'Total computation steps', result: compareConditions(etStepsArr, gsStepsArr) },
    ];

    const etCreatures = etRuns[0]?.finalCreatures ?? [];
    const gsCreatures = gsRuns[0]?.finalCreatures ?? [];

    return {
      fitnessTraining, fitnessTransfer,
      popTraining, popTransfer,
      divTraining, divTransfer,
      traitEvolution,
      etGap, gsGap,
      etSteps, gsSteps, gsSearchEvals,
      statRows,
      etCreatures, gsCreatures,
      config,
    };
  }, [results]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto px-6 py-12 space-y-16"
    >
      <div>
        <h2 className="font-serif text-2xl text-text-primary mb-2 border-b border-bg-tertiary pb-3">
          Results
        </h2>
        <p className="text-sm text-text-muted mt-4 font-sans">
          Grid search found optimal configuration: speed={results.gridSearchResult.bestSpeed},
          size={results.gridSearchResult.bestSize},
          senseRange={results.gridSearchResult.bestSenseRange}
          (fitness={results.gridSearchResult.bestFitness.toFixed(2)}).
        </p>
      </div>

      {/* Section 4a: Training Phase */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Training Phase (Environment 1)
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <FitnessChart data={analysis.fitnessTraining} title="Fitness Over Training" />
          <PopulationChart data={analysis.popTraining} title="Population Over Training" />
        </div>
        <DiversityChart data={analysis.divTraining} title="Trait Diversity Over Training" />
      </div>

      {/* Section 4b: Transfer Phase */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Transfer Phase (Environment 2)
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <FitnessChart data={analysis.fitnessTransfer} title="Fitness During Transfer" />
          <GeneralizationGapChart etGaps={analysis.etGap} gsGaps={analysis.gsGap} />
        </div>
        <PopulationChart data={analysis.popTransfer} title="Population During Transfer" />
      </div>

      {/* Section 4c: Trait Evolution */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Trait Evolution
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <TraitEvolutionChart
            data={analysis.traitEvolution}
            trainingGens={analysis.config.trainingGenerations}
          />
          <TraitScatterPlot
            etCreatures={analysis.etCreatures}
            gsCreatures={analysis.gsCreatures}
          />
        </div>
      </div>

      {/* Section 4d: Computational Efficiency */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Computational Efficiency
        </h3>
        <ComputationChart
          etSteps={analysis.etSteps}
          gsSteps={analysis.gsSteps}
          gsSearchEvals={analysis.gsSearchEvals}
        />
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-bg-tertiary text-text-muted">
                <th className="text-left py-2">Metric</th>
                <th className="text-right py-2">ET</th>
                <th className="text-right py-2">GS</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-bg-tertiary/50">
                <td className="py-2">Total simulation steps</td>
                <td className="text-right">{analysis.etSteps.toLocaleString()}</td>
                <td className="text-right">{analysis.gsSteps.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-bg-tertiary/50">
                <td className="py-2">Grid search evaluations</td>
                <td className="text-right">0</td>
                <td className="text-right">{analysis.gsSearchEvals}</td>
              </tr>
              <tr>
                <td className="py-2">Wall-clock time</td>
                <td className="text-right" colSpan={2}>{(results.wallClockMs / 1000).toFixed(1)}s total</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4e: Statistical Summary */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Statistical Summary
        </h3>
        <StatisticsTable rows={analysis.statRows} />
      </div>
    </motion.section>
  );
}
