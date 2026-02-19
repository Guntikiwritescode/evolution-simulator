import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import {
  isActive, canReach as canReachFn, addObjective, sleep,
  ObjectiveIntensity,
  type Creature, type Objective,
} from '../creature';
import { howHomesick } from './homesick';

function getHomesickObjective(creature: Creature): Objective | null {
  const foodCount = creature.foodsEaten.length;
  if (foodCount === 0) return null;
  if (foodCount > 1) {
    return {
      pos: creature.homePos,
      intensity: ObjectiveIntensity.MajorCraving,
      reason: 'satisfied',
    };
  }
  return howHomesick(creature);
}

export class SatisfiedBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, _sim: Simulation): void {
    if (phase !== Phase.ORIENT) return;
    for (const c of generation.creatures) {
      if (!isActive(c)) continue;
      const obj = getHomesickObjective(c);
      if (!obj) continue;
      addObjective(c, obj);
      if (canReachFn(c, c.homePos)) {
        sleep(c);
      }
    }
  }
}
