import type { Point2 } from './math';
import { projectToLine, distanceToLine } from './math';
import type { RNG } from './rng';

export type Edge = [Point2, Point2];

export interface Stage {
  getEdges(): Edge[];
  canMoveTo(to: Point2): boolean;
  getCenter(): Point2;
  getRandomLocation(rng: RNG): Point2;
  getNearestEdgePoint(pos: Point2): Point2;
  constrainWithin(pos: Point2): Point2;
}

export class SquareStage implements Stage {
  constructor(public readonly size: number) {}

  getEdges(): Edge[] {
    const s = this.size;
    return [
      [[0, 0], [s, 0]],
      [[s, 0], [s, s]],
      [[s, s], [0, s]],
      [[0, s], [0, 0]],
    ];
  }

  canMoveTo(to: Point2): boolean {
    return to[0] >= 0 && to[1] >= 0 && to[0] <= this.size && to[1] <= this.size;
  }

  getCenter(): Point2 {
    return [0.5 * this.size, 0.5 * this.size];
  }

  getRandomLocation(rng: RNG): Point2 {
    return [rng.random(0, this.size), rng.random(0, this.size)];
  }

  getNearestEdgePoint(pos: Point2): Point2 {
    const hw = 0.5 * this.size;
    const x = pos[0] > hw ? this.size : 0;
    const y = pos[1] > hw ? this.size : 0;

    if (Math.abs(x - pos[0]) < Math.abs(y - pos[1])) {
      return [x, pos[1]];
    } else {
      return [pos[0], y];
    }
  }

  constrainWithin(pos: Point2): Point2 {
    return [
      Math.max(0, Math.min(this.size, pos[0])),
      Math.max(0, Math.min(this.size, pos[1])),
    ];
  }
}
