import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import {
  isActive, canSee, canReach, addObjective,
  eatFood, ObjectiveIntensity,
  type Creature,
} from '../creature';
import type { Food } from '../food';
import { isFoodEaten } from '../food';
import { vecSub, vecNorm } from '../math';

function isCreatureHungry(c: Creature): boolean {
  return isActive(c) && c.foodsEaten.length < 2;
}

function nearestFood(creature: Creature, available: Food[]): Food | null {
  let best: Food | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < available.length; i++) {
    const dx = available[i].position[0] - creature.pos[0];
    const dy = available[i].position[1] - creature.pos[1];
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = available[i];
    }
  }
  return best;
}

export class ScavengeBehaviour implements StepBehaviour {
  apply(phase: Phase, generation: Generation, _sim: Simulation): void {
    if (phase === Phase.ORIENT) {
      const available = generation.getAvailableFood();
      if (available.length === 0) return;
      for (const c of generation.creatures) {
        if (!isCreatureHungry(c)) continue;
        const food = nearestFood(c, available);
        if (food && canSee(c, food.position)) {
          const intensity = c.foodsEaten.length === 0
            ? ObjectiveIntensity.VitalCraving
            : c.foodsEaten.length === 1
              ? ObjectiveIntensity.ModerateCraving
              : ObjectiveIntensity.MinorCraving;
          addObjective(c, {
            pos: food.position,
            intensity,
            reason: 'see food',
          });
        }
      }
    }

    if (phase === Phase.ACT) {
      let available = generation.getAvailableFood();
      if (available.length === 0) return;
      for (const c of generation.creatures) {
        if (!isCreatureHungry(c)) continue;
        if (available.length === 0) break;
        const food = nearestFood(c, available);
        if (food && !isFoodEaten(food) && canReach(c, food.position)) {
          eatFood(c, generation.steps, food);
          generation.markFoodEaten(food);
          available = available.filter(f => f.id !== food.id);
        }
      }
    }
  }
}
