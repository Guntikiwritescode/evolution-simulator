import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import { isActive, getDirection, addObjective, ObjectiveIntensity } from '../creature';
import { vecAdd, rotateVector } from '../math';

export class WanderBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, sim: Simulation): void {
    if (phase !== Phase.ORIENT) return;
    for (const c of generation.creatures) {
      if (!isActive(c)) continue;
      const ang = sim.getRandomFloat(-Math.PI / 4, Math.PI / 4);
      const dir = getDirection(c);
      const rotated = rotateVector(dir, ang);
      const target = vecAdd(c.pos, rotated);
      if (sim.stage.canMoveTo(target)) {
        addObjective(c, {
          pos: target,
          intensity: ObjectiveIntensity.MinorCraving,
          reason: 'wandering',
        });
      } else {
        addObjective(c, {
          pos: sim.stage.getCenter(),
          intensity: ObjectiveIntensity.MinorCraving,
          reason: 'wandering',
        });
      }
    }
  }
}
