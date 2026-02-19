import { RNG } from './rng';
import type { Stage } from './stage';
import type { Point2 } from './math';
import type { Creature } from './creature';
import { Generation } from './generation';
import { Interpolator } from './interpolator';
import type { StepBehaviour, ReproductionBehaviour } from './behaviours/types';
import { ResetBehaviour } from './behaviours/reset';
import { BasicReproductionBehaviour } from './behaviours/reproduction';

export class Simulation {
  rng: RNG;
  stage: Stage;
  foodPerGeneration: Interpolator;
  generations: Generation[];
  behaviours: StepBehaviour[];
  reproductionBehaviour: ReproductionBehaviour;

  constructor(stage: Stage, seed: number | string, foodPerGeneration: Interpolator) {
    this.stage = stage;
    this.rng = new RNG(seed);
    this.foodPerGeneration = foodPerGeneration;
    this.generations = [];
    this.behaviours = [new ResetBehaviour()];
    this.reproductionBehaviour = new BasicReproductionBehaviour();
  }

  addBehaviour(b: StepBehaviour): void {
    this.behaviours.push(b);
  }

  setReproductionBehaviour(b: ReproductionBehaviour): void {
    this.reproductionBehaviour = b;
  }

  getRandomLocation(): Point2 {
    return this.stage.getRandomLocation(this.rng);
  }

  getRandomFloat(from: number, to: number): number {
    return this.rng.random(from, to);
  }

  getRandomGaussian(mean: number, variance: number): number {
    return this.rng.gaussian(mean, variance);
  }

  generateFood(): Point2[] {
    const gen = this.generations.length;
    const numFoods = Math.round(this.foodPerGeneration.get(gen));
    const locations: Point2[] = [];
    for (let i = 0; i < numFoods; i++) {
      locations.push(this.getRandomLocation());
    }
    return locations;
  }

  execReproduction(creatures: Creature[]): Creature[] {
    return this.reproductionBehaviour.reproduce(creatures, this);
  }

  run(creatures: Creature[], maxGenerations: number): void {
    let generation = new Generation(this, creatures, this.generateFood());
    let keepGoing = generation.hasLivingCreatures();

    for (let gen = 1; gen < maxGenerations; gen++) {
      if (!keepGoing) break;
      const newCreatures = this.execReproduction(generation.creatures);
      this.generations.push(generation);
      const next = new Generation(this, newCreatures, this.generateFood());
      generation = next;
      keepGoing = generation.hasLivingCreatures();
    }

    this.generations.push(generation);
  }

  runSingleGeneration(creatures: Creature[]): Generation {
    return new Generation(this, creatures, this.generateFood());
  }
}
