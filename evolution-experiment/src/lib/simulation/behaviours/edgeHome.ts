import type { StepBehaviour } from './types';
import { Phase } from './types';
import type { Generation } from '../generation';
import type { Simulation } from '../simulation';
import { isAlive, type Creature } from '../creature';
import { distanceToLine, projectToLine, vecAdd, type Point2 } from '../math';

export class EdgeHomeBehaviour implements StepBehaviour {
  constructor(public disabledEdges: number[] = []) {}

  private setHome(creature: Creature, sim: Simulation): void {
    const edges = sim.stage.getEdges();
    let nearestEdge: [Point2, Point2] | null = null;
    let nearestDist = Infinity;

    for (let i = 0; i < edges.length; i++) {
      if (this.disabledEdges.includes(i)) continue;
      const d = distanceToLine(edges[i][0], edges[i][1], creature.pos);
      if (d !== null && d < nearestDist) {
        nearestDist = d;
        nearestEdge = edges[i];
      }
    }

    if (nearestEdge) {
      const proj = projectToLine(nearestEdge[0], nearestEdge[1], creature.pos);
      if (proj) {
        creature.homePos = vecAdd(nearestEdge[0], proj);
      }
    } else {
      creature.homePos = [Number.MAX_VALUE, 0];
    }
  }

  apply(phase: Phase, generation: Generation, sim: Simulation): void {
    if (phase !== Phase.PRE) return;
    for (const c of generation.creatures) {
      if (!isAlive(c)) continue;
      this.setHome(c, sim);
    }
  }
}
