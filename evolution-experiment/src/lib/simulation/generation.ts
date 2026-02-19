import type { Creature } from './creature';
import { isAlive, isActive } from './creature';
import type { Food } from './food';
import { createFood, isFoodEaten } from './food';
import type { Point2 } from './math';
import { Phase } from './behaviours/types';
import type { Simulation } from './simulation';

const MAX_STEPS = 10_000;

export class Generation {
  steps: number = 1;
  creatures: Creature[];
  food: Food[];
  private _availableFoodDirty: boolean = true;
  private _availableFoodCache: Food[] = [];

  constructor(sim: Simulation, creatures: Creature[], foodLocations: Point2[]) {
    this.creatures = creatures;
    this.food = foodLocations.map(p => createFood(p));
    this.runPhase(Phase.INIT, sim);
    this.stepToCompletion(sim);
    this.runPhase(Phase.FINAL, sim);
  }

  hasLivingCreatures(): boolean {
    return this.creatures.some(c => isAlive(c));
  }

  hasActiveCreatures(): boolean {
    for (let i = 0; i < this.creatures.length; i++) {
      if (isActive(this.creatures[i])) return true;
    }
    return false;
  }

  getAvailableFood(): Food[] {
    if (this._availableFoodDirty) {
      this._availableFoodCache = this.food.filter(f => !isFoodEaten(f));
      this._availableFoodDirty = false;
    }
    return this._availableFoodCache;
  }

  markFoodEaten(food: Food): void {
    const idx = this.food.findIndex(f => f.id === food.id);
    if (idx !== -1) {
      this.food[idx].status = { eaten: this.steps };
      this._availableFoodDirty = true;
    }
  }

  private stepToCompletion(sim: Simulation): void {
    while (this.hasActiveCreatures()) {
      this.step(sim);
    }
  }

  private runPhase(phase: Phase, sim: Simulation): void {
    for (const b of sim.behaviours) {
      b.apply(phase, this, sim);
    }
  }

  private shuffleCreatures(sim: Simulation): void {
    sim.rng.shuffle(this.creatures);
  }

  private step(sim: Simulation): void {
    if (this.steps >= MAX_STEPS) {
      for (const c of this.creatures) {
        if (isActive(c)) {
          c.state = 'dead';
        }
      }
      return;
    }

    this.shuffleCreatures(sim);
    this._availableFoodDirty = true;
    this.runPhase(Phase.PRE, sim);
    this.runPhase(Phase.ORIENT, sim);
    this.runPhase(Phase.MOVE, sim);
    this.runPhase(Phase.ACT, sim);
    this.runPhase(Phase.POST, sim);
    this.steps += 1;
  }
}
