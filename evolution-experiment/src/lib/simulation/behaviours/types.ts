import type { Generation } from '../generation';
import type { Simulation } from '../simulation';

export enum Phase {
  REPRODUCE = 'REPRODUCE',
  INIT = 'INIT',
  PRE = 'PRE',
  ORIENT = 'ORIENT',
  MOVE = 'MOVE',
  ACT = 'ACT',
  POST = 'POST',
  FINAL = 'FINAL',
}

export interface StepBehaviour {
  apply(phase: Phase, generation: Generation, simulation: Simulation): void;
}

export interface ReproductionBehaviour {
  reproduce(creatures: import('../creature').Creature[], simulation: Simulation): import('../creature').Creature[];
}
