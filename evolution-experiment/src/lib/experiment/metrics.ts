import type { Generation } from '../simulation/generation';
import { isAlive, getSpeed, getSize, getSenseRange } from '../simulation/creature';
import { BasicReproductionBehaviour } from '../simulation/behaviours/reproduction';

export interface GenerationMetrics {
  generation: number;
  population: number;
  meanFoodEaten: number;
  survivalRate: number;
  reproductionRate: number;
  meanSpeed: number;
  meanSize: number;
  meanSenseRange: number;
  speedVariance: number;
  sizeVariance: number;
  senseRangeVariance: number;
  traitDiversity: number;
  creaturesEaten: number;
  computationSteps: number;
}

export function collectGenerationMetrics(gen: Generation, genIndex: number): GenerationMetrics {
  const creatures = gen.creatures;
  const n = creatures.length;

  if (n === 0) {
    return {
      generation: genIndex,
      population: 0,
      meanFoodEaten: 0,
      survivalRate: 0,
      reproductionRate: 0,
      meanSpeed: 0,
      meanSize: 0,
      meanSenseRange: 0,
      speedVariance: 0,
      sizeVariance: 0,
      senseRangeVariance: 0,
      traitDiversity: 0,
      creaturesEaten: 0,
      computationSteps: gen.steps,
    };
  }

  let totalFood = 0;
  let aliveCount = 0;
  let reproduceCount = 0;
  let totalSpeed = 0;
  let totalSize = 0;
  let totalSense = 0;
  let creaturesEatenCount = 0;

  const speeds: number[] = [];
  const sizes: number[] = [];
  const senses: number[] = [];

  for (const c of creatures) {
    const foodCount = c.foodsEaten.length;
    totalFood += foodCount;
    if (isAlive(c)) aliveCount++;
    if (BasicReproductionBehaviour.willReproduce(c)) reproduceCount++;

    const sp = c.speed.value;
    const sz = c.size.value;
    const sr = c.senseRange.value;
    totalSpeed += sp;
    totalSize += sz;
    totalSense += sr;
    speeds.push(sp);
    sizes.push(sz);
    senses.push(sr);

    for (const f of c.foodsEaten) {
      if (f.type === 'creature') creaturesEatenCount++;
    }
  }

  const meanSpeed = totalSpeed / n;
  const meanSize = totalSize / n;
  const meanSense = totalSense / n;

  const speedVar = computeVariance(speeds, meanSpeed);
  const sizeVar = computeVariance(sizes, meanSize);
  const senseVar = computeVariance(senses, meanSense);

  const normSpeedVar = meanSpeed > 0 ? speedVar / (meanSpeed * meanSpeed) : 0;
  const normSizeVar = meanSize > 0 ? sizeVar / (meanSize * meanSize) : 0;
  const normSenseVar = meanSense > 0 ? senseVar / (meanSense * meanSense) : 0;
  const traitDiversity = normSpeedVar + normSizeVar + normSenseVar;

  return {
    generation: genIndex,
    population: n,
    meanFoodEaten: totalFood / n,
    survivalRate: aliveCount / n,
    reproductionRate: reproduceCount / n,
    meanSpeed,
    meanSize,
    meanSenseRange: meanSense,
    speedVariance: speedVar,
    sizeVariance: sizeVar,
    senseRangeVariance: senseVar,
    traitDiversity,
    creaturesEaten: creaturesEatenCount,
    computationSteps: gen.steps,
  };
}

function computeVariance(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  let sum = 0;
  for (const v of values) {
    const d = v - mean;
    sum += d * d;
  }
  return sum / (values.length - 1);
}
