'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { useExperiment, type ExperimentState } from '../hooks/useExperiment';
import type { ExperimentConfig } from '../lib/experiment/config';

interface ExperimentContextValue {
  state: ExperimentState;
  start: (config?: ExperimentConfig) => void;
  cancel: () => void;
}

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const experiment = useExperiment();
  return (
    <ExperimentContext.Provider value={experiment}>
      {children}
    </ExperimentContext.Provider>
  );
}

export function useExperimentContext(): ExperimentContextValue {
  const ctx = useContext(ExperimentContext);
  if (!ctx) throw new Error('useExperimentContext must be used within ExperimentProvider');
  return ctx;
}
