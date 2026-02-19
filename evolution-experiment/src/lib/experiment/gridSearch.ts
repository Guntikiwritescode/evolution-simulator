import { Simulation } from '../simulation/simulation';
import { SquareStage } from '../simulation/stage';
import { Interpolator } from '../simulation/interpolator';
import { createCreatureWithTraits, type Creature, type MutatableTrait } from '../simulation/creature';
import { BasicMoveBehaviour } from '../simulation/behaviours/move';
import { WanderBehaviour } from '../simulation/behaviours/wander';
import { CannibalismBehaviour } from '../simulation/behaviours/cannibalism';
import { ScavengeBehaviour } from '../simulation/behaviours/scavenge';
import { SatisfiedBehaviour } from '../simulation/behaviours/satisfied';
import { EdgeHomeBehaviour } from '../simulation/behaviours/edgeHome';
import { StarveBehaviour } from '../simulation/behaviours/starve';
import { CloneReproductionBehaviour } from '../simulation/behaviours/reproduction';
import type { EnvironmentConfig } from './config';
import { CREATURE_DEFAULTS } from './config';

export interface GridSearchEntry {
  speed: number;
  size: number;
  senseRange: number;
  meanFoodEaten: number;
  populationSurvived: number;
}

export interface GridSearchResult {
  entries: GridSearchEntry[];
  bestSpeed: number;
  bestSize: number;
  bestSenseRange: number;
  bestFitness: number;
}

export function runGridSearch(
  speedValues: number[],
  sizeValues: number[],
  senseValues: number[],
  env: EnvironmentConfig,
  populationSize: number,
  seed: number,
  onProgress?: (completed: number, total: number) => void,
): GridSearchResult {
  const total = speedValues.length * sizeValues.length * senseValues.length;
  const entries: GridSearchEntry[] = [];
  let bestEntry: GridSearchEntry | null = null;
  let count = 0;

  for (const speed of speedValues) {
    for (const size of sizeValues) {
      for (const sense of senseValues) {
        const fitness = evaluateConfig(speed, size, sense, env, populationSize, seed);
        const entry: GridSearchEntry = {
          speed,
          size,
          senseRange: sense,
          meanFoodEaten: fitness.meanFood,
          populationSurvived: fitness.survived,
        };
        entries.push(entry);

        if (!bestEntry || entry.meanFoodEaten > bestEntry.meanFoodEaten) {
          bestEntry = entry;
        }

        count++;
        if (onProgress) onProgress(count, total);
      }
    }
  }

  return {
    entries,
    bestSpeed: bestEntry?.speed ?? CREATURE_DEFAULTS.speed,
    bestSize: bestEntry?.size ?? CREATURE_DEFAULTS.size,
    bestSenseRange: bestEntry?.senseRange ?? CREATURE_DEFAULTS.senseRange,
    bestFitness: bestEntry?.meanFoodEaten ?? 0,
  };
}

function evaluateConfig(
  speed: number,
  size: number,
  senseRange: number,
  env: EnvironmentConfig,
  populationSize: number,
  seed: number,
): { meanFood: number; survived: number } {
  const stage = new SquareStage(env.worldSize);
  const foodInterp = new Interpolator([[0, env.foodPerGeneration]]);
  const sim = new Simulation(stage, `gs-eval-${seed}-${speed}-${size}-${senseRange}`, foodInterp);

  sim.addBehaviour(new BasicMoveBehaviour());
  sim.addBehaviour(new WanderBehaviour());
  sim.addBehaviour(new CannibalismBehaviour(0.8));
  sim.addBehaviour(new ScavengeBehaviour());
  sim.addBehaviour(new SatisfiedBehaviour());
  sim.addBehaviour(new EdgeHomeBehaviour(env.disabledEdges));
  sim.addBehaviour(new StarveBehaviour());
  sim.setReproductionBehaviour(new CloneReproductionBehaviour());

  const trait = (v: number): MutatableTrait => ({ value: v, variance: 0 });
  const creatures: Creature[] = [];
  for (let i = 0; i < populationSize; i++) {
    const rawPos = sim.getRandomLocation();
    const pos = stage.getNearestEdgePoint(rawPos);
    creatures.push(createCreatureWithTraits(
      pos,
      trait(speed),
      trait(size),
      trait(senseRange),
      trait(CREATURE_DEFAULTS.reach),
      trait(CREATURE_DEFAULTS.fleeDistance),
      trait(CREATURE_DEFAULTS.lifeSpan),
      CREATURE_DEFAULTS.energy,
    ));
  }

  const gen = sim.runSingleGeneration(creatures);

  let totalFood = 0;
  let survived = 0;
  for (const c of gen.creatures) {
    totalFood += c.foodsEaten.length;
    if (c.foodsEaten.length > 0) survived++;
  }

  return {
    meanFood: gen.creatures.length > 0 ? totalFood / gen.creatures.length : 0,
    survived,
  };
}
