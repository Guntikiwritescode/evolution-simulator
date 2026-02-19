import { Simulation } from '../simulation/simulation';
import { SquareStage } from '../simulation/stage';
import { Interpolator } from '../simulation/interpolator';
import {
  createCreatureWithTraits,
  type Creature,
  type MutatableTrait,
  isAlive,
} from '../simulation/creature';
import { BasicMoveBehaviour } from '../simulation/behaviours/move';
import { WanderBehaviour } from '../simulation/behaviours/wander';
import { CannibalismBehaviour } from '../simulation/behaviours/cannibalism';
import { ScavengeBehaviour } from '../simulation/behaviours/scavenge';
import { SatisfiedBehaviour } from '../simulation/behaviours/satisfied';
import { EdgeHomeBehaviour } from '../simulation/behaviours/edgeHome';
import { StarveBehaviour } from '../simulation/behaviours/starve';
import { BasicReproductionBehaviour, CloneReproductionBehaviour } from '../simulation/behaviours/reproduction';
import { collectGenerationMetrics, type GenerationMetrics } from './metrics';
import { runGridSearch, type GridSearchResult } from './gridSearch';
import type { ExperimentConfig, EnvironmentConfig } from './config';
import { CREATURE_DEFAULTS, DEFAULT_CONFIG } from './config';

export interface RunResult {
  seed: number;
  trainingMetrics: GenerationMetrics[];
  transferMetrics: GenerationMetrics[];
  finalCreatures: Creature[];
}

export interface ExperimentResults {
  config: ExperimentConfig;
  gridSearchResult: GridSearchResult;
  etRuns: RunResult[];
  gsRuns: RunResult[];
  wallClockMs: number;
}

export type ProgressPhase = 'grid-search' | 'et-training' | 'gs-training' | 'et-transfer' | 'gs-transfer';

export interface ProgressUpdate {
  phase: ProgressPhase;
  currentRun: number;
  totalRuns: number;
  currentGeneration: number;
  totalGenerations: number;
  percentComplete: number;
}

function createSimulation(
  env: EnvironmentConfig,
  seed: string | number,
  useEvolution: boolean,
): Simulation {
  const stage = new SquareStage(env.worldSize);
  const foodInterp = new Interpolator([[0, env.foodPerGeneration]]);
  const sim = new Simulation(stage, seed, foodInterp);

  sim.addBehaviour(new BasicMoveBehaviour());
  sim.addBehaviour(new WanderBehaviour());
  sim.addBehaviour(new CannibalismBehaviour(0.8));
  sim.addBehaviour(new ScavengeBehaviour());
  sim.addBehaviour(new SatisfiedBehaviour());
  sim.addBehaviour(new EdgeHomeBehaviour(env.disabledEdges));
  sim.addBehaviour(new StarveBehaviour());

  if (!useEvolution) {
    sim.setReproductionBehaviour(new CloneReproductionBehaviour());
  }

  return sim;
}

function createETCreatures(sim: Simulation, count: number): Creature[] {
  const trait = (v: number, variance: number): MutatableTrait => ({ value: v, variance });
  const creatures: Creature[] = [];
  const stage = sim.stage as SquareStage;

  for (let i = 0; i < count; i++) {
    const rawPos = sim.getRandomLocation();
    const pos = stage.getNearestEdgePoint(rawPos);
    creatures.push(createCreatureWithTraits(
      pos,
      trait(CREATURE_DEFAULTS.speed, CREATURE_DEFAULTS.variance),
      trait(CREATURE_DEFAULTS.size, CREATURE_DEFAULTS.variance),
      trait(CREATURE_DEFAULTS.senseRange, CREATURE_DEFAULTS.variance),
      trait(CREATURE_DEFAULTS.reach, 0),
      trait(CREATURE_DEFAULTS.fleeDistance, 0),
      trait(CREATURE_DEFAULTS.lifeSpan, 0),
      CREATURE_DEFAULTS.energy,
    ));
  }
  return creatures;
}

function createGSCreatures(
  sim: Simulation,
  count: number,
  speed: number,
  size: number,
  senseRange: number,
): Creature[] {
  const trait = (v: number): MutatableTrait => ({ value: v, variance: 0 });
  const creatures: Creature[] = [];
  const stage = sim.stage as SquareStage;

  for (let i = 0; i < count; i++) {
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
  return creatures;
}

function runTrainingPhase(
  sim: Simulation,
  creatures: Creature[],
  generations: number,
): { metrics: GenerationMetrics[]; finalCreatures: Creature[] } {
  sim.run(creatures, generations);
  const metrics: GenerationMetrics[] = [];
  for (let i = 0; i < sim.generations.length; i++) {
    metrics.push(collectGenerationMetrics(sim.generations[i], i));
  }
  const lastGen = sim.generations[sim.generations.length - 1];
  return { metrics, finalCreatures: lastGen.creatures.filter(c => isAlive(c)) };
}

function transferCreatures(creatures: Creature[], sim: Simulation): Creature[] {
  return sim.execReproduction(creatures);
}

export function runFullExperiment(
  config: ExperimentConfig = DEFAULT_CONFIG,
  onProgress?: (update: ProgressUpdate) => void,
  shouldCancel?: () => boolean,
): ExperimentResults | null {
  const startTime = Date.now();
  let totalPhases = 0;
  const gsEvals = config.gridSearchSpeedSize.length ** 2 * config.gridSearchSense.length;
  const totalWork = gsEvals + config.numRuns * 4;
  let completedWork = 0;

  function reportProgress(phase: ProgressPhase, run: number, gen: number, totalGen: number) {
    if (!onProgress) return;
    onProgress({
      phase,
      currentRun: run,
      totalRuns: config.numRuns,
      currentGeneration: gen,
      totalGenerations: totalGen,
      percentComplete: (completedWork / totalWork) * 100,
    });
  }

  // Phase 1: Grid Search
  const gridResult = runGridSearch(
    config.gridSearchSpeedSize,
    config.gridSearchSpeedSize,
    config.gridSearchSense,
    config.env1,
    config.populationSize,
    config.baseSeed,
    (done, total) => {
      completedWork = done;
      reportProgress('grid-search', 0, done, total);
    },
  );

  if (shouldCancel?.()) return null;
  completedWork = gsEvals;

  // Phase 2: ET Training + Transfer
  const etRuns: RunResult[] = [];
  for (let r = 0; r < config.numRuns; r++) {
    if (shouldCancel?.()) return null;
    const seed = config.baseSeed + r;
    reportProgress('et-training', r + 1, 0, config.trainingGenerations);

    const trainSim = createSimulation(config.env1, `et-train-${seed}`, true);
    const creatures = createETCreatures(trainSim, config.populationSize);
    const trainResult = runTrainingPhase(trainSim, creatures, config.trainingGenerations);

    completedWork = gsEvals + r * 4 + 1;
    reportProgress('et-transfer', r + 1, 0, config.transferGenerations);

    const transferSim = createSimulation(config.env2, `et-transfer-${seed}`, true);
    const transferCreats = transferCreatures(trainResult.finalCreatures, transferSim);
    const transferResult = runTrainingPhase(transferSim, transferCreats, config.transferGenerations);

    etRuns.push({
      seed,
      trainingMetrics: trainResult.metrics,
      transferMetrics: transferResult.metrics,
      finalCreatures: transferResult.finalCreatures,
    });

    completedWork = gsEvals + r * 4 + 2;
  }

  // Phase 3: GS Training + Transfer
  const gsRuns: RunResult[] = [];
  for (let r = 0; r < config.numRuns; r++) {
    if (shouldCancel?.()) return null;
    const seed = config.baseSeed + r;
    reportProgress('gs-training', r + 1, 0, config.trainingGenerations);

    const trainSim = createSimulation(config.env1, `gs-train-${seed}`, false);
    const creatures = createGSCreatures(
      trainSim,
      config.populationSize,
      gridResult.bestSpeed,
      gridResult.bestSize,
      gridResult.bestSenseRange,
    );
    const trainResult = runTrainingPhase(trainSim, creatures, config.trainingGenerations);

    completedWork = gsEvals + config.numRuns * 2 + r * 2 + 1;
    reportProgress('gs-transfer', r + 1, 0, config.transferGenerations);

    const transferSim = createSimulation(config.env2, `gs-transfer-${seed}`, false);
    const transferCreats = transferCreatures(trainResult.finalCreatures, transferSim);
    const transferResult = runTrainingPhase(transferSim, transferCreats, config.transferGenerations);

    gsRuns.push({
      seed,
      trainingMetrics: trainResult.metrics,
      transferMetrics: transferResult.metrics,
      finalCreatures: transferResult.finalCreatures,
    });

    completedWork = gsEvals + config.numRuns * 2 + r * 2 + 2;
  }

  return {
    config,
    gridSearchResult: gridResult,
    etRuns,
    gsRuns,
    wallClockMs: Date.now() - startTime,
  };
}
