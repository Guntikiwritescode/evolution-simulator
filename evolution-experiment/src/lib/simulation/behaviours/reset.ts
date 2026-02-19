import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import { isAlive, resetObjective } from '../creature';

export class ResetBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, _sim: Simulation): void {
    if (phase !== Phase.PRE) return;
    for (const c of generation.creatures) {
      if (!isAlive(c)) continue;
      resetObjective(c);
    }
  }
}
