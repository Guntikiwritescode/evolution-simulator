import type { ReproductionBehaviour } from './types';
import type { Simulation } from '../simulation';
import { type Creature, isAlive, mutateCreature, growOlder } from '../creature';

export class BasicReproductionBehaviour implements ReproductionBehaviour {
  static willReproduce(creature: Creature): boolean {
    return creature.foodsEaten.length > 1;
  }

  reproduce(creatures: Creature[], sim: Simulation): Creature[] {
    const result: Creature[] = [];
    for (const c of creatures) {
      if (!isAlive(c)) continue;
      if (BasicReproductionBehaviour.willReproduce(c)) {
        result.push(mutateCreature(c, sim.rng));
      }
      result.push(growOlder(c));
    }
    return result;
  }
}

export class CloneReproductionBehaviour implements ReproductionBehaviour {
  reproduce(creatures: Creature[], _sim: Simulation): Creature[] {
    const result: Creature[] = [];
    for (const c of creatures) {
      if (!isAlive(c)) continue;
      if (c.foodsEaten.length > 1) {
        const clone = growOlder(c);
        clone.age = 0;
        result.push(clone);
      }
      result.push(growOlder(c));
    }
    return result;
  }
}
