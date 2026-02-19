'use client';
import { useReducer, useCallback } from 'react';
import type { ExperimentResults, ProgressUpdate } from '../lib/experiment/runner';
import type { ExperimentConfig } from '../lib/experiment/config';
import { useSimulationWorker } from './useWorker';

export type ExperimentStatus = 'idle' | 'running' | 'complete' | 'cancelled' | 'error';

export interface ExperimentState {
  status: ExperimentStatus;
  progress: ProgressUpdate | null;
  results: ExperimentResults | null;
  error: string | null;
}

type Action =
  | { type: 'START' }
  | { type: 'PROGRESS'; data: ProgressUpdate }
  | { type: 'COMPLETE'; data: ExperimentResults }
  | { type: 'ERROR'; error: string }
  | { type: 'CANCEL' }
  | { type: 'CANCELLED' };

function reducer(state: ExperimentState, action: Action): ExperimentState {
  switch (action.type) {
    case 'START':
      return { status: 'running', progress: null, results: null, error: null };
    case 'PROGRESS':
      return { ...state, progress: action.data };
    case 'COMPLETE':
      return { ...state, status: 'complete', results: action.data };
    case 'ERROR':
      return { ...state, status: 'error', error: action.error };
    case 'CANCEL':
      return { ...state, status: 'cancelled' };
    case 'CANCELLED':
      return { ...state, status: 'cancelled' };
    default:
      return state;
  }
}

const initialState: ExperimentState = {
  status: 'idle',
  progress: null,
  results: null,
  error: null,
};

export function useExperiment() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { start: startWorker, cancel: cancelWorker } = useSimulationWorker({
    onProgress: (update) => dispatch({ type: 'PROGRESS', data: update }),
    onComplete: (results) => dispatch({ type: 'COMPLETE', data: results }),
    onError: (error) => dispatch({ type: 'ERROR', error }),
    onCancelled: () => dispatch({ type: 'CANCELLED' }),
  });

  const start = useCallback((config?: ExperimentConfig) => {
    dispatch({ type: 'START' });
    startWorker(config);
  }, [startWorker]);

  const cancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
    cancelWorker();
  }, [cancelWorker]);

  return { state, start, cancel };
}
