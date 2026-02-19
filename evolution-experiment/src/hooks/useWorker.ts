'use client';
import { useRef, useCallback, useEffect } from 'react';
import type { WorkerMessage, WorkerResponse } from '../workers/simulationWorker';
import type { ExperimentConfig } from '../lib/experiment/config';
import type { ProgressUpdate, ExperimentResults } from '../lib/experiment/runner';

interface UseWorkerCallbacks {
  onProgress: (update: ProgressUpdate) => void;
  onComplete: (results: ExperimentResults) => void;
  onError: (error: string) => void;
  onCancelled: () => void;
}

export function useSimulationWorker(callbacks: UseWorkerCallbacks) {
  const workerRef = useRef<Worker | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const start = useCallback((config?: ExperimentConfig) => {
    workerRef.current?.terminate();
    const worker = new Worker(new URL('../workers/simulationWorker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'progress': cbRef.current.onProgress(msg.data); break;
        case 'complete': cbRef.current.onComplete(msg.data); break;
        case 'error': cbRef.current.onError(msg.error); break;
        case 'cancelled': cbRef.current.onCancelled(); break;
      }
    };

    worker.onerror = (e) => {
      cbRef.current.onError(e.message || 'Worker error');
    };

    const message: WorkerMessage = { type: 'start', config };
    worker.postMessage(message);
  }, []);

  const cancel = useCallback(() => {
    const msg: WorkerMessage = { type: 'cancel' };
    workerRef.current?.postMessage(msg);
  }, []);

  return { start, cancel };
}
