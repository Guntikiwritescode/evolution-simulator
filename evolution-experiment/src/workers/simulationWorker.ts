import { runFullExperiment, type ProgressUpdate, type ExperimentResults } from '../lib/experiment/runner';
import { DEFAULT_CONFIG, type ExperimentConfig } from '../lib/experiment/config';

export type WorkerMessage =
  | { type: 'start'; config?: ExperimentConfig }
  | { type: 'cancel' };

export type WorkerResponse =
  | { type: 'progress'; data: ProgressUpdate }
  | { type: 'complete'; data: ExperimentResults }
  | { type: 'error'; error: string }
  | { type: 'cancelled' };

let cancelled = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  if (msg.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (msg.type === 'start') {
    cancelled = false;
    const config = msg.config ?? DEFAULT_CONFIG;

    try {
      const result = runFullExperiment(
        config,
        (update) => {
          (self as unknown as Worker).postMessage({ type: 'progress', data: update } as WorkerResponse);
        },
        () => cancelled,
      );

      if (cancelled) {
        (self as unknown as Worker).postMessage({ type: 'cancelled' } as WorkerResponse);
      } else if (result) {
        (self as unknown as Worker).postMessage({ type: 'complete', data: result } as WorkerResponse);
      }
    } catch (err) {
      (self as unknown as Worker).postMessage({
        type: 'error',
        error: err instanceof Error ? err.message : String(err),
      } as WorkerResponse);
    }
  }
};
