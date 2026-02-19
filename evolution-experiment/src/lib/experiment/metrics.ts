import type { Generation } from '../simulation/generation';
import { isAlive, getSpeed, getSize, getSenseRange, getReach } from '../simulation/creature';
import { BasicReproductionBehaviour } from '../simulation/behaviours/reproduction';

export interface GenerationMetrics {
  generation: number;
  population: number;
  meanFoodEaten: number;
  medianFoodEaten: number;
  survivalRate: number;
  reproductionRate: number;
  meanSpeed: number;
  meanSize: number;
  meanSenseRange: number;
  meanReach: number;
  meanFleeDistance: number;
  speedVariance: number;
  sizeVariance: number;
  senseRangeVariance: number;
  reachVariance: number;
  traitDiversity: number;
  shannonDiversity: number;
  creaturesEaten: number;
  energyEfficiency: number;
  computationSteps: number;
}

const EMPTY_METRICS: Omit<GenerationMetrics, 'generation' | 'computationSteps'> = {
  population: 0, meanFoodEaten: 0, medianFoodEaten: 0,
  survivalRate: 0, reproductionRate: 0,
  meanSpeed: 0, meanSize: 0, meanSenseRange: 0, meanReach: 0, meanFleeDistance: 0,
  speedVariance: 0, sizeVariance: 0, senseRangeVariance: 0, reachVariance: 0,
  traitDiversity: 0, shannonDiversity: 0, creaturesEaten: 0, energyEfficiency: 0,
};

export function collectGenerationMetrics(gen: Generation, genIndex: number): GenerationMetrics {
  const creatures = gen.creatures;
  const n = creatures.length;

  if (n === 0) {
    return { ...EMPTY_METRICS, generation: genIndex, computationSteps: gen.steps };
  }

  let totalFood = 0;
  let aliveCount = 0;
  let reproduceCount = 0;
  let totalSpeed = 0, totalSize = 0, totalSense = 0, totalReach = 0, totalFlee = 0;
  let creaturesEatenCount = 0;

  const speeds: number[] = [];
  const sizes: number[] = [];
  const senses: number[] = [];
  const reaches: number[] = [];
  const foodCounts: number[] = [];

  for (const c of creatures) {
    const foodCount = c.foodsEaten.length;
    totalFood += foodCount;
    foodCounts.push(foodCount);
    if (isAlive(c)) aliveCount++;
    if (BasicReproductionBehaviour.willReproduce(c)) reproduceCount++;

    const sp = c.speed.value;
    const sz = c.size.value;
    const sr = c.senseRange.value;
    const rc = c.reach.value;
    const fl = c.fleeDistance.value;
    totalSpeed += sp; totalSize += sz; totalSense += sr; totalReach += rc; totalFlee += fl;
    speeds.push(sp); sizes.push(sz); senses.push(sr); reaches.push(rc);

    for (const f of c.foodsEaten) {
      if (f.type === 'creature') creaturesEatenCount++;
    }
  }

  const meanSpeed = totalSpeed / n;
  const meanSize = totalSize / n;
  const meanSense = totalSense / n;
  const meanReach = totalReach / n;
  const meanFlee = totalFlee / n;

  const speedVar = computeVariance(speeds, meanSpeed);
  const sizeVar = computeVariance(sizes, meanSize);
  const senseVar = computeVariance(senses, meanSense);
  const reachVar = computeVariance(reaches, meanReach);

  const normSpeedVar = meanSpeed > 0 ? speedVar / (meanSpeed * meanSpeed) : 0;
  const normSizeVar = meanSize > 0 ? sizeVar / (meanSize * meanSize) : 0;
  const normSenseVar = meanSense > 0 ? senseVar / (meanSense * meanSense) : 0;
  const normReachVar = meanReach > 0 ? reachVar / (meanReach * meanReach) : 0;
  const traitDiversity = normSpeedVar + normSizeVar + normSenseVar + normReachVar;

  const shannon = computeShannonDiversity(speeds, sizes, senses);

  foodCounts.sort((a, b) => a - b);
  const medianFood = n % 2 === 0
    ? (foodCounts[n / 2 - 1] + foodCounts[n / 2]) / 2
    : foodCounts[Math.floor(n / 2)];

  const energyEff = gen.steps > 0 ? totalFood / gen.steps : 0;

  return {
    generation: genIndex,
    population: n,
    meanFoodEaten: totalFood / n,
    medianFoodEaten: medianFood,
    survivalRate: aliveCount / n,
    reproductionRate: reproduceCount / n,
    meanSpeed, meanSize, meanSenseRange: meanSense, meanReach, meanFleeDistance: meanFlee,
    speedVariance: speedVar, sizeVariance: sizeVar, senseRangeVariance: senseVar, reachVariance: reachVar,
    traitDiversity, shannonDiversity: shannon,
    creaturesEaten: creaturesEatenCount,
    energyEfficiency: energyEff,
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

function computeShannonDiversity(speeds: number[], sizes: number[], senses: number[]): number {
  const n = speeds.length;
  if (n <= 1) return 0;

  const BINS = 10;
  const binCounts = new Map<string, number>();

  const sRange = range(speeds);
  const zRange = range(sizes);
  const rRange = range(senses);

  for (let i = 0; i < n; i++) {
    const sb = sRange.span > 0 ? Math.min(BINS - 1, Math.floor(((speeds[i] - sRange.min) / sRange.span) * BINS)) : 0;
    const zb = zRange.span > 0 ? Math.min(BINS - 1, Math.floor(((sizes[i] - zRange.min) / zRange.span) * BINS)) : 0;
    const rb = rRange.span > 0 ? Math.min(BINS - 1, Math.floor(((senses[i] - rRange.min) / rRange.span) * BINS)) : 0;
    const key = `${sb},${zb},${rb}`;
    binCounts.set(key, (binCounts.get(key) || 0) + 1);
  }

  let H = 0;
  for (const count of binCounts.values()) {
    const p = count / n;
    if (p > 0) H -= p * Math.log(p);
  }
  return H;
}

function range(arr: number[]): { min: number; max: number; span: number } {
  let min = Infinity, max = -Infinity;
  for (const v of arr) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max, span: max - min };
}
