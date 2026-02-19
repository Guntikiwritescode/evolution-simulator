import type { Creature } from './creature';
import { isAlive, isActive } from './creature';
import type { Food } from './food';
import { createFood, isFoodEaten } from './food';
import type { Point2 } from './math';
import { Phase } from './behaviours/types';
import type { Simulation } from './simulation';

const MAX_STEPS = 1_000_000;

export class Generation {
  steps: number = 1;
  creatures: Creature[];
  food: Food[];

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
    return this.creatures.some(c => isActive(c));
  }

  getAvailableFood(): Food[] {
    return this.food.filter(f => !isFoodEaten(f));
  }

  markFoodEaten(food: Food): void {
    const idx = this.food.findIndex(f => f.id === food.id);
    if (idx !== -1) {
      this.food[idx].status = { eaten: this.steps };
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
    if (this.steps >= MAX_STEPS) return;

    this.shuffleCreatures(sim);
    this.runPhase(Phase.PRE, sim);
    this.runPhase(Phase.ORIENT, sim);
    this.runPhase(Phase.MOVE, sim);
    this.runPhase(Phase.ACT, sim);
    this.runPhase(Phase.POST, sim);
    this.steps += 1;
  }
}
