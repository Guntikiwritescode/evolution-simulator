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
  trainingGenerations: 100,
  transferGenerations: 50,
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
  gridSearchSpeedSize: [3, 6, 9, 12, 15, 18, 21, 24],
  gridSearchSense: [5, 10, 15, 20, 25, 30, 35, 40],
};

export const CREATURE_DEFAULTS = {
  speed: 10.0,
  size: 10.0,
  senseRange: 20.0,
  reach: 1.0,
  fleeDistance: 1e12,
  lifeSpan: 1e4,
  speedVariance: 1.0,
  sizeVariance: 1.0,
  senseRangeVariance: 1.0,
  reachVariance: 0.3,
  fleeDistanceVariance: 0.0,
  lifeSpanVariance: 0.0,
  energy: 500.0,
};
