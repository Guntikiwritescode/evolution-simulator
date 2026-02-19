import { lerp } from './math';

export class Interpolator {
  private pts: [number, number][];

  constructor(pts: [number, number][]) {
    this.pts = [...pts];
  }

  get(x: number): number {
    const len = this.pts.length;
    if (len === 0) return 0;

    const minX = this.pts[0][0];
    const maxX = this.pts[len - 1][0];

    if (x < minX) return this.pts[0][1];
    if (x >= maxX) return this.pts[len - 1][1];

    let i = 0;
    for (let idx = 0; idx < len; idx++) {
      i = idx;
      if (x < this.pts[idx][0]) break;
    }

    const x1 = this.pts[i - 1][0];
    const x2 = this.pts[i][0];
    if (x1 === x2) return this.pts[i][1];

    const t = (x - x1) / (x2 - x1);
    return lerp(this.pts[i - 1][1], this.pts[i][1], t);
  }
}
