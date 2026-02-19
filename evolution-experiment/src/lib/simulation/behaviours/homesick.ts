import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import {
  isActive, getSpeed, getMotionEnergyCost, getEnergyLeft,
  canReach as canReachFn, addObjective, sleep,
  ObjectiveIntensity,
  type Creature, type Objective,
} from '../creature';
import { vecSub, vecNorm } from '../math';

export function howHomesick(creature: Creature): Objective | null {
  const dist = vecNorm(vecSub(creature.homePos, creature.pos));
  const cost = getMotionEnergyCost(creature);
  const speed = getSpeed(creature);
  if (speed === 0) return null;
  const stepsToHome = dist / speed;
  const homesickFactor = cost > 0 ? getEnergyLeft(creature) / cost - stepsToHome : Infinity;

  let intensity: ObjectiveIntensity | null;
  if (homesickFactor > 10.0) {
    intensity = null;
  } else if (homesickFactor > 5.0) {
    intensity = ObjectiveIntensity.MinorCraving;
  } else if (homesickFactor > 0.0) {
    intensity = ObjectiveIntensity.MajorCraving;
  } else {
    intensity = ObjectiveIntensity.VitalCraving;
  }

  if (intensity === null) return null;
  return {
    pos: creature.homePos,
    intensity,
    reason: 'low energy',
  };
}

export class HomesickBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, _sim: Simulation): void {
    if (phase !== Phase.ORIENT) return;
    for (const c of generation.creatures) {
      if (!isActive(c)) continue;
      const obj = howHomesick(c);
      if (!obj) continue;
      if (canReachFn(c, c.homePos)) {
        sleep(c);
      } else {
        addObjective(c, obj);
      }
    }
  }
}
