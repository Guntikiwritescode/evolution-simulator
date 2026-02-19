'use client';
import { motion } from 'framer-motion';
import type { ExperimentResults } from '../lib/experiment/runner';
import { metricsToCSV, gridSearchToCSV, downloadCSV } from '../lib/utils/csv';
import { DEFAULT_CONFIG } from '../lib/experiment/config';

interface DataExportProps {
  results: ExperimentResults;
}

export default function DataExport({ results }: DataExportProps) {
  const handleDownload = (type: string) => {
    switch (type) {
      case 'et-training':
        downloadCSV(metricsToCSV(results.etRuns, 'training'), 'et_training_metrics.csv');
        break;
      case 'et-transfer':
        downloadCSV(metricsToCSV(results.etRuns, 'transfer'), 'et_transfer_metrics.csv');
        break;
      case 'gs-training':
        downloadCSV(metricsToCSV(results.gsRuns, 'training'), 'gs_training_metrics.csv');
        break;
      case 'gs-transfer':
        downloadCSV(metricsToCSV(results.gsRuns, 'transfer'), 'gs_transfer_metrics.csv');
        break;
      case 'grid-search':
        downloadCSV(gridSearchToCSV(results.gridSearchResult.entries), 'grid_search_results.csv');
        break;
    }
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(results.config, null, 2));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <h2 className="font-serif text-2xl text-text-primary mb-8 border-b border-bg-tertiary pb-3">
        Raw Data Export
      </h2>
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 space-y-4">
        <p className="text-sm text-text-secondary mb-4">
          Download raw per-generation metrics for all {results.config.numRuns} runs as CSV files.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'et-training', label: 'ET Training' },
            { key: 'et-transfer', label: 'ET Transfer' },
            { key: 'gs-training', label: 'GS Training' },
            { key: 'gs-transfer', label: 'GS Transfer' },
            { key: 'grid-search', label: 'Grid Search (216)' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => handleDownload(item.key)}
              className="px-4 py-2 text-xs font-mono text-text-secondary border border-bg-tertiary
                rounded hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              {item.label} CSV
            </button>
          ))}
          <button
            onClick={handleCopyConfig}
            className="px-4 py-2 text-xs font-mono text-accent-et border border-accent-et/30
              rounded hover:bg-accent-et/10 transition-colors"
          >
            Copy Config JSON
          </button>
        </div>
      </div>
    </motion.section>
  );
}
