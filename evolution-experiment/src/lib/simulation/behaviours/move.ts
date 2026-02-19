import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import { isActive, getSpeed, getDirection, moveTo } from '../creature';
import { vecAdd, vecScale } from '../math';

export class BasicMoveBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, sim: Simulation): void {
    if (phase !== Phase.MOVE) return;
    for (const c of generation.creatures) {
      if (!isActive(c)) continue;
      const pos = c.pos;
      const dir = getDirection(c);
      const newPos = vecAdd(pos, vecScale(dir, getSpeed(c)));
      const constrained = sim.stage.constrainWithin(newPos);
      moveTo(c, constrained);
    }
  }
}
