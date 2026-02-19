export interface EnvironmentConfig {
  worldSize: number;
  foodPerGeneration: number;
  disabledEdges: number[];
}

export interface ExperimentConfig {
  trainingGenerations: number;
  transferGenerations: number;
  numRuns: number;
  populationSize: number;
  baseSeed: number;
  env1: EnvironmentConfig;
  env2: EnvironmentConfig;
  gridSearchSpeedSize: number[];
  gridSearchSense: number[];
}

export const DEFAULT_CONFIG: ExperimentConfig = {
  trainingGenerations: 50,
  transferGenerations: 25,
  numRuns: 30,
  populationSize: 50,
  baseSeed: 1000,
  env1: {
    worldSize: 500,
    foodPerGeneration: 50,
    disabledEdges: [],
  },
  env2: {
    worldSize: 800,
    foodPerGeneration: 30,
    disabledEdges: [2, 3],
  },
  gridSearchSpeedSize: [4, 7, 10, 13, 16, 19],
  gridSearchSense: [5, 10, 15, 20, 25, 30],
};

export const CREATURE_DEFAULTS = {
  speed: 10.0,
  size: 10.0,
  senseRange: 20.0,
  reach: 1.0,
  fleeDistance: 1e12,
  lifeSpan: 1e4,
  variance: 0.5,
  energy: 500.0,
};
