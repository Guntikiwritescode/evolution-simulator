'use client';
import { motion } from 'framer-motion';
import { useExperimentContext } from '../context/ExperimentContext';
import ProgressBar from './ui/ProgressBar';

const PHASE_LABELS: Record<string, string> = {
  'grid-search': 'Grid Search (216 configurations)',
  'et-training': 'ET Training (Environment 1)',
  'gs-training': 'GS Training (Environment 1)',
  'et-transfer': 'ET Transfer (Environment 2)',
  'gs-transfer': 'GS Transfer (Environment 2)',
};

export default function ExperimentRunner() {
  const { state, start, cancel } = useExperimentContext();
  const { status, progress } = state;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <h2 className="font-serif text-2xl text-text-primary mb-8 border-b border-bg-tertiary pb-3">
        Run Experiment
      </h2>

      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-8">
        {status === 'idle' && (
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-6">
              The experiment will run 30 independent replications of each condition (ET and GS)
              across two environments. This typically takes 3&ndash;8 minutes depending on your device.
            </p>
            <button
              onClick={() => start()}
              className="px-8 py-3 bg-accent-et text-white font-sans font-medium text-sm
                rounded-lg hover:bg-accent-etLight transition-colors
                focus:outline-none focus:ring-2 focus:ring-accent-et focus:ring-offset-2 focus:ring-offset-bg-primary"
            >
              Run Experiment
            </button>
          </div>
        )}

        {status === 'running' && progress && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-sm font-medium text-text-primary">
                  {PHASE_LABELS[progress.phase] || progress.phase}
                </p>
                <p className="font-mono text-xs text-text-muted mt-1">
                  Run {progress.currentRun} / {progress.totalRuns} &middot;
                  Generation {progress.currentGeneration} / {progress.totalGenerations}
                </p>
              </div>
              <button
                onClick={cancel}
                className="px-4 py-1.5 text-xs font-mono text-red-400 border border-red-400/30
                  rounded hover:bg-red-400/10 transition-colors"
              >
                Cancel
              </button>
            </div>
            <ProgressBar percent={progress.percentComplete} label="Overall Progress" />

            <div className="flex gap-2 flex-wrap">
              {(['grid-search', 'et-training', 'et-transfer', 'gs-training', 'gs-transfer'] as const).map(phase => {
                const isCurrent = progress.phase === phase;
                const phases = ['grid-search', 'et-training', 'et-transfer', 'gs-training', 'gs-transfer'];
                const isDone = phases.indexOf(progress.phase) > phases.indexOf(phase);
                return (
                  <span
                    key={phase}
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      isCurrent ? 'bg-accent-et/20 text-accent-et' :
                      isDone ? 'bg-bg-tertiary text-text-muted line-through' :
                      'bg-bg-tertiary/50 text-text-muted'
                    }`}
                  >
                    {phase.replace('-', ' ')}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {status === 'running' && !progress && (
          <div className="text-center py-4">
            <p className="text-sm text-text-secondary">Initializing simulation worker...</p>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center">
            <p className="text-sm text-green-400 mb-4">
              Experiment completed successfully in{' '}
              <span className="font-mono">{((state.results?.wallClockMs ?? 0) / 1000).toFixed(1)}s</span>
            </p>
            <button
              onClick={() => start()}
              className="px-6 py-2 text-xs font-mono text-text-muted border border-bg-tertiary
                rounded hover:bg-bg-tertiary transition-colors"
            >
              Re-run Experiment
            </button>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="text-center">
            <p className="text-sm text-text-muted mb-4">Experiment was cancelled.</p>
            <button
              onClick={() => start()}
              className="px-6 py-2 text-xs font-mono text-text-secondary border border-bg-tertiary
                rounded hover:bg-bg-tertiary transition-colors"
            >
              Start Again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <p className="text-sm text-red-400 mb-2">An error occurred:</p>
            <p className="text-xs font-mono text-red-300/70 mb-4">{state.error}</p>
            <button
              onClick={() => start()}
              className="px-6 py-2 text-xs font-mono text-text-secondary border border-bg-tertiary
                rounded hover:bg-bg-tertiary transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}
