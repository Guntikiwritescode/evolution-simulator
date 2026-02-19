import { v4 as uuidv4 } from 'uuid';
import type { Point2, Vector2 } from './math';
import { vecSub, vecAdd, vecScale, vecNorm, vecNormalize, vecNeg, distanceToLine } from './math';
import type { RNG } from './rng';
import type { Edible, FoodType } from './food';

const ENERGY_COST_SCALE_FACTOR = 1 / 10000;

export enum ObjectiveIntensity {
  MinorCraving = 0,
  MinorAversion = 1,
  ModerateCraving = 2,
  ModerateAversion = 3,
  MajorCraving = 4,
  MajorAversion = 5,
  VitalCraving = 6,
  VitalAversion = 7,
}

export function isAversion(intensity: ObjectiveIntensity): boolean {
  return (
    intensity === ObjectiveIntensity.MinorAversion ||
    intensity === ObjectiveIntensity.ModerateAversion ||
    intensity === ObjectiveIntensity.MajorAversion ||
    intensity === ObjectiveIntensity.VitalAversion
  );
}

export interface Objective {
  pos: Point2;
  intensity: ObjectiveIntensity;
  reason: string;
}

export interface MutatableTrait {
  value: number;
  variance: number;
}

export type CreatureState = 'active' | 'asleep' | 'dead';

export interface FoodRecord {
  step: number;
  id: string;
  type: FoodType;
}

export interface Creature {
  id: string;
  speed: MutatableTrait;
  size: MutatableTrait;
  senseRange: MutatableTrait;
  reach: MutatableTrait;
  fleeDistance: MutatableTrait;
  lifeSpan: MutatableTrait;

  energy: number;
  energyConsumed: number;
  age: number;
  pos: Point2;
  homePos: Point2;
  foodsEaten: FoodRecord[];
  movementHistory: Point2[];
  state: CreatureState;
  objective: Objective | null;
}

function mutatePositiveNonZero(rng: RNG, center: number, variance: number): number {
  return Math.max(Number.MIN_VALUE, rng.gaussian(center, variance));
}

function mutatePositive(rng: RNG, center: number, variance: number): number {
  return Math.max(0, rng.gaussian(center, variance));
}

export function createDefaultCreature(pos: Point2): Creature {
  return {
    id: uuidv4(),
    speed: { value: 1.0, variance: 1.0 },
    size: { value: 1.0, variance: 1.0 },
    senseRange: { value: 1.0, variance: 1.0 },
    reach: { value: 1.0, variance: 1.0 },
    fleeDistance: { value: 1.0, variance: 1.0 },
    lifeSpan: { value: 1.0, variance: 1.0 },
    energy: 500.0,
    energyConsumed: 0.0,
    age: 0,
    pos: [pos[0], pos[1]],
    homePos: [pos[0], pos[1]],
    foodsEaten: [],
    movementHistory: [[pos[0], pos[1]]],
    state: 'active',
    objective: null,
  };
}

export function createCreatureWithTraits(
  pos: Point2,
  speed: MutatableTrait,
  size: MutatableTrait,
  senseRange: MutatableTrait,
  reach: MutatableTrait,
  fleeDistance: MutatableTrait,
  lifeSpan: MutatableTrait,
  energy: number = 500.0,
): Creature {
  return {
    id: uuidv4(),
    speed,
    size,
    senseRange,
    reach,
    fleeDistance,
    lifeSpan,
    energy,
    energyConsumed: 0.0,
    age: 0,
    pos: [pos[0], pos[1]],
    homePos: [pos[0], pos[1]],
    foodsEaten: [],
    movementHistory: [[pos[0], pos[1]]],
    state: 'active',
    objective: null,
  };
}

export function withNewPosition(c: Creature, pos: Point2): Creature {
  return {
    ...c,
    id: uuidv4(),
    pos: [pos[0], pos[1]],
    homePos: [pos[0], pos[1]],
    movementHistory: [[pos[0], pos[1]]],
    foodsEaten: [],
    energyConsumed: 0.0,
    age: c.age,
    state: 'active',
    objective: null,
  };
}

export function mutateCreature(c: Creature, rng: RNG): Creature {
  const homePos: Point2 = [c.homePos[0], c.homePos[1]];
  return {
    ...createDefaultCreature(homePos),
    speed: { value: mutatePositiveNonZero(rng, c.speed.value, c.speed.variance), variance: c.speed.variance },
    size: { value: mutatePositiveNonZero(rng, c.size.value, c.size.variance), variance: c.size.variance },
    senseRange: { value: mutatePositive(rng, c.senseRange.value, c.senseRange.variance), variance: c.senseRange.variance },
    reach: { value: mutatePositiveNonZero(rng, c.reach.value, c.reach.variance), variance: c.reach.variance },
    fleeDistance: { value: mutatePositive(rng, c.fleeDistance.value, c.fleeDistance.variance), variance: c.fleeDistance.variance },
    lifeSpan: { value: mutatePositiveNonZero(rng, c.lifeSpan.value, c.lifeSpan.variance), variance: c.lifeSpan.variance },
    energy: c.energy,
  };
}

export function growOlder(c: Creature): Creature {
  const homePos: Point2 = [c.homePos[0], c.homePos[1]];
  return {
    ...createDefaultCreature(homePos),
    id: c.id,
    speed: { ...c.speed },
    size: { ...c.size },
    senseRange: { ...c.senseRange },
    reach: { ...c.reach },
    fleeDistance: { ...c.fleeDistance },
    lifeSpan: { ...c.lifeSpan },
    energy: c.energy,
    age: c.age + 1,
  };
}

export function getSize(c: Creature): number {
  return c.size.value;
}

export function getSpeed(c: Creature): number {
  return c.speed.value * c.size.value / 10;
}

export function getSenseRange(c: Creature): number {
  return c.senseRange.value;
}

export function getReach(c: Creature): number {
  return Math.max(c.reach.value, getSize(c) / 4);
}

export function getLifeSpan(c: Creature): number {
  return c.lifeSpan.value;
}

export function getMotionEnergyCost(c: Creature): number {
  const s = getSize(c);
  const sp = getSpeed(c);
  const sr = getSenseRange(c);
  return ENERGY_COST_SCALE_FACTOR * (s * s * s * sp * sp + sr);
}

export function getEnergyLeft(c: Creature): number {
  return Math.max(0, c.energy - c.energyConsumed);
}

export function applyEnergyCost(c: Creature, cost: number): void {
  c.energyConsumed += cost;
  if (getEnergyLeft(c) <= 0) {
    c.state = 'dead';
  }
}

export function moveTo(c: Creature, pos: Point2): void {
  c.pos = [pos[0], pos[1]];
  c.movementHistory.push([pos[0], pos[1]]);
  const cost = getMotionEnergyCost(c);
  applyEnergyCost(c, cost);
}

export function getLastPosition(c: Creature): Point2 | null {
  const len = c.movementHistory.length;
  if (len <= 1) return null;
  return c.movementHistory[len - 2];
}

export function getDirection(c: Creature): Vector2 {
  let disp: Vector2 | null = null;

  if (c.objective) {
    let d = vecSub(c.objective.pos, c.pos);
    if (isAversion(c.objective.intensity)) {
      d = vecScale(d, -1);
    }
    if (vecNorm(d) !== 0) {
      disp = d;
    }
  }

  if (!disp) {
    const last = getLastPosition(c);
    if (last) {
      disp = vecSub(c.pos, last);
    }
    if (!disp || vecNorm(disp) === 0) {
      disp = [1, 0];
    }
  }

  return vecNormalize(disp);
}

export function canSee(c: Creature, pt: Point2): boolean {
  return vecNorm(vecSub(pt, c.pos)) <= getSenseRange(c);
}

export function canReachNow(c: Creature, pt: Point2): boolean {
  return vecNorm(vecSub(pt, c.pos)) <= getReach(c);
}

export function canReach(c: Creature, pt: Point2): boolean {
  if (canReachNow(c, pt)) return true;

  const last = getLastPosition(c);
  if (!last) return false;

  const d = distanceToLine(c.pos, last, pt);
  return d !== null && d <= getReach(c);
}

export function withinFleeDistance(c: Creature, pt: Point2): boolean {
  if (canSee(c, pt)) {
    const d = vecNorm(vecSub(c.pos, pt));
    return d < c.fleeDistance.value;
  }
  return false;
}

export function addObjective(c: Creature, obj: Objective): void {
  if (!c.objective) {
    c.objective = obj;
    return;
  }
  if (obj.intensity > c.objective.intensity) {
    c.objective = obj;
    return;
  }
  if (obj.intensity === c.objective.intensity) {
    const distOld = vecNorm(vecSub(c.pos, c.objective.pos));
    const distNew = vecNorm(vecSub(c.pos, obj.pos));
    if (distNew < distOld) {
      c.objective = obj;
    }
  }
}

export function resetObjective(c: Creature): void {
  c.objective = null;
}

export function eatFood(c: Creature, step: number, food: Edible): void {
  c.foodsEaten.push({ step, id: food.getEdibleId(), type: food.getType() });
}

export function sleep(c: Creature): void {
  c.state = 'asleep';
}

export function kill(c: Creature): void {
  c.state = 'dead';
}

export function isAlive(c: Creature): boolean {
  return c.state !== 'dead';
}

export function isActive(c: Creature): boolean {
  return c.state === 'active';
}
