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
  computeFitnessTrendSlopes,
  computeRecoveryRate,
} from '../lib/experiment/analysis';
import { compareConditions, setNumComparisons, linearRegression } from '../lib/experiment/statistics';
import { fmt, fmtSlope } from '../lib/utils/format';
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
    const shannonTraining = computeChartData(etRuns, gsRuns, 'training', m => m.shannonDiversity);

    const traitEvolution = getTraitEvolutionData(etRuns);

    const etFinalFitness = getFinalMetricValues(etRuns, 'training', m => m.meanFoodEaten);
    const gsFinalFitness = getFinalMetricValues(gsRuns, 'training', m => m.meanFoodEaten);
    const etTransferEarly = getFinalMetricValues(etRuns, 'transfer', m => m.meanFoodEaten, 10);
    const gsTransferEarly = getFinalMetricValues(gsRuns, 'transfer', m => m.meanFoodEaten, 10);
    const etTransferLate = etRuns.map(r => {
      const last10 = r.transferMetrics.slice(-10);
      return last10.length > 0 ? last10.reduce((s, m) => s + m.meanFoodEaten, 0) / last10.length : 0;
    });
    const gsTransferLate = gsRuns.map(r => {
      const last10 = r.transferMetrics.slice(-10);
      return last10.length > 0 ? last10.reduce((s, m) => s + m.meanFoodEaten, 0) / last10.length : 0;
    });
    const etGap = getGeneralizationGap(etRuns, m => m.meanFoodEaten);
    const gsGap = getGeneralizationGap(gsRuns, m => m.meanFoodEaten);
    const etDiversity = getFinalMetricValues(etRuns, 'training', m => m.traitDiversity);
    const gsDiversity = getFinalMetricValues(gsRuns, 'training', m => m.traitDiversity);
    const etShannon = getFinalMetricValues(etRuns, 'training', m => m.shannonDiversity);
    const gsShannon = getFinalMetricValues(gsRuns, 'training', m => m.shannonDiversity);

    const etTransferSlopes = computeFitnessTrendSlopes(etRuns, 'transfer');
    const gsTransferSlopes = computeFitnessTrendSlopes(gsRuns, 'transfer');
    const etRecovery = computeRecoveryRate(etRuns);
    const gsRecovery = computeRecoveryRate(gsRuns);

    const etMedianFood = getFinalMetricValues(etRuns, 'training', m => m.medianFoodEaten);
    const gsMedianFood = getFinalMetricValues(gsRuns, 'training', m => m.medianFoodEaten);
    const etEfficiency = getFinalMetricValues(etRuns, 'training', m => m.energyEfficiency);
    const gsEfficiency = getFinalMetricValues(gsRuns, 'training', m => m.energyEfficiency);

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

    const NUM_COMPARISONS = 10;
    setNumComparisons(NUM_COMPARISONS);

    const statRows = [
      { metric: 'Final training fitness (mean)', result: compareConditions(etFinalFitness, gsFinalFitness) },
      { metric: 'Final training fitness (median)', result: compareConditions(etMedianFood, gsMedianFood) },
      { metric: 'Transfer fitness (gen 1\u201310)', result: compareConditions(etTransferEarly, gsTransferEarly) },
      { metric: 'Transfer fitness (last 10 gen)', result: compareConditions(etTransferLate, gsTransferLate) },
      { metric: 'Generalization gap', result: compareConditions(etGap, gsGap) },
      { metric: 'Transfer trend slope', result: compareConditions(etTransferSlopes, gsTransferSlopes) },
      { metric: 'Recovery rate (%\u0394)', result: compareConditions(etRecovery, gsRecovery) },
      { metric: 'Trait diversity (CV\u00B2)', result: compareConditions(etDiversity, gsDiversity) },
      { metric: 'Shannon diversity (H)', result: compareConditions(etShannon, gsShannon) },
      { metric: 'Energy efficiency', result: compareConditions(etEfficiency, gsEfficiency) },
    ];

    const etCreatures = etRuns[0]?.finalCreatures ?? [];
    const gsCreatures = gsRuns[0]?.finalCreatures ?? [];

    const etMeanTrendSlope = linearRegression(etTransferSlopes);
    const gsMeanTrendSlope = linearRegression(gsTransferSlopes);

    return {
      fitnessTraining, fitnessTransfer,
      popTraining, popTransfer,
      divTraining, divTransfer,
      shannonTraining,
      traitEvolution,
      etGap, gsGap,
      etSteps, gsSteps, gsSearchEvals,
      statRows,
      etCreatures, gsCreatures,
      config,
      etTransferSlopes, gsTransferSlopes,
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
          Grid search evaluated <span className="font-mono">{results.gridSearchResult.entries.length}</span> configurations.
          Optimal: speed={results.gridSearchResult.bestSpeed},
          size={results.gridSearchResult.bestSize},
          senseRange={results.gridSearchResult.bestSenseRange}
          (fitness={results.gridSearchResult.bestFitness.toFixed(3)}).
          N={results.config.numRuns} independent replications per condition.
        </p>
      </div>

      {/* Training Phase */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Training Phase &mdash; {analysis.config.trainingGenerations} Generations (Environment 1)
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <FitnessChart data={analysis.fitnessTraining} title="Mean Fitness Over Training" />
          <PopulationChart data={analysis.popTraining} title="Population Over Training" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <DiversityChart data={analysis.divTraining} title="Trait Diversity (CV\u00B2 Sum)" />
          <DiversityChart data={analysis.shannonTraining} title="Shannon Diversity Index (H)" />
        </div>
      </div>

      {/* Transfer Phase */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Transfer Phase &mdash; {analysis.config.transferGenerations} Generations (Environment 2)
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <FitnessChart data={analysis.fitnessTransfer} title="Fitness During Transfer" />
          <GeneralizationGapChart etGaps={analysis.etGap} gsGaps={analysis.gsGap} />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <PopulationChart data={analysis.popTransfer} title="Population During Transfer" />
          <DiversityChart data={analysis.divTransfer} title="Diversity During Transfer" />
        </div>

        {/* Trend slope summary */}
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
          <h4 className="font-serif text-sm text-text-primary mb-3">Adaptation Trend (H&#8324;)</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Linear regression of mean fitness over transfer generations.
            A positive slope indicates adaptation to the new environment.
          </p>
          <div className="grid grid-cols-2 gap-6 mt-4 font-mono text-sm">
            <div>
              <span className="text-accent-et">ET mean slope:</span>{' '}
              <span className="text-text-primary">
                {fmtSlope(analysis.etTransferSlopes.reduce((a, b) => a + b, 0) / analysis.etTransferSlopes.length)}
              </span>
            </div>
            <div>
              <span className="text-accent-gs">GS mean slope:</span>{' '}
              <span className="text-text-primary">
                {fmtSlope(analysis.gsTransferSlopes.reduce((a, b) => a + b, 0) / analysis.gsTransferSlopes.length)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trait Evolution */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Trait Evolution (ET Only)
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

      {/* Computational Efficiency */}
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

      {/* Full Statistical Summary */}
      <div className="space-y-6">
        <h3 className="font-serif text-xl text-text-primary">
          Statistical Summary
        </h3>
        <StatisticsTable rows={analysis.statRows} />
      </div>
    </motion.section>
  );
}
