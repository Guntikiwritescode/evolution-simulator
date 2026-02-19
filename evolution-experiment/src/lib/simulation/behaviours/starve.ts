import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import { isActive, isAlive, getSpeed, kill } from '../creature';

export class StarveBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, _sim: Simulation): void {
    if (phase === Phase.INIT) {
      for (const c of generation.creatures) {
        if (getSpeed(c) === 0) {
          kill(c);
        }
      }
    }

    if (phase === Phase.POST) {
      const foodAvailable = generation.getAvailableFood().length;
      if (foodAvailable === 0) {
        for (const c of generation.creatures) {
          if (isActive(c) && c.foodsEaten.length < 1) {
            kill(c);
          }
        }
      }
    }

    if (phase === Phase.FINAL) {
      for (const c of generation.creatures) {
        if (isAlive(c) && c.foodsEaten.length < 1) {
          kill(c);
        }
      }
    }
  }
}
