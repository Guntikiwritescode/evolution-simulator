import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import {
  isActive, getSize, getSpeed, canSee, canReach,
  withinFleeDistance, addObjective, eatFood, kill,
  ObjectiveIntensity,
  type Creature,
} from '../creature';
import { vecSub, vecAdd, rotateVector } from '../math';

export class CannibalismBehaviour implements StepBehaviour {
  constructor(public sizeRatio: number = 0.8) {}

  private forPredPreyPair(
    creatures: Creature[],
    func: (predator: Creature, prey: Creature) => void,
  ): void {
    for (let i = 1; i < creatures.length; i++) {
      if (!isActive(creatures[i])) continue;
      for (let j = 0; j < i; j++) {
        const a = creatures[j];
        const b = creatures[i];
        if (!isActive(a) || !isActive(b)) continue;

        let predator: Creature;
        let prey: Creature;
        if (getSize(a) > getSize(b)) {
          predator = a;
          prey = b;
        } else {
          predator = b;
          prey = a;
        }

        if (!isActive(predator) || !isActive(prey)) continue;
        if (getSize(predator) * this.sizeRatio < getSize(prey)) continue;

        func(predator, prey);
      }
    }
  }

  apply(phase: Phase, generation: Generation, sim: Simulation): void {
    if (phase === Phase.ORIENT) {
      const targetPreySpeed = new Map<string, number>();

      this.forPredPreyPair(generation.creatures, (predator, prey) => {
        if (withinFleeDistance(prey, predator.pos)) {
          const ang = sim.getRandomFloat(-Math.PI / 4, Math.PI / 4);
          const dir = vecSub(predator.pos, prey.pos);
          const noisy = vecAdd(prey.pos, rotateVector(dir, ang));
          addObjective(prey, {
            pos: noisy,
            intensity: ObjectiveIntensity.VitalAversion,
            reason: 'running away',
          });
        }

        if (!canSee(predator, prey.pos)) return;

        const prevSpeed = targetPreySpeed.get(predator.id);
        if (prevSpeed !== undefined && prevSpeed <= getSpeed(prey)) return;

        targetPreySpeed.set(predator.id, getSpeed(prey));

        const intensity = predator.foodsEaten.length === 0
          ? ObjectiveIntensity.VitalCraving
          : predator.foodsEaten.length === 1
            ? ObjectiveIntensity.ModerateCraving
            : ObjectiveIntensity.MinorCraving;

        addObjective(predator, {
          pos: prey.pos,
          intensity,
          reason: 'see prey',
        });
      });
    }

    if (phase === Phase.ACT) {
      const steps = generation.steps;
      this.forPredPreyPair(generation.creatures, (predator, prey) => {
        if (!canReach(predator, prey.pos)) return;
        eatFood(predator, steps, { getEdibleId: () => prey.id, getType: () => 'creature' });
        kill(prey);
      });
    }
  }
}
