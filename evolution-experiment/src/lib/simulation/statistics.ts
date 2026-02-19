export interface RunningStatisticsResults {
  mean: number;
  deviation: number;
  sum: number;
  size: number;
  max: number;
  min: number;
}

export class RunningStatistics {
  private m: number = 0;
  private s: number = 0;
  private n: number = 0;
  private total: number = 0;
  private _max: number = -Infinity;
  private _min: number = Infinity;

  push(v: number): void {
    this.n += 1;
    const x = v - this.m;
    this.m += x / this.n;
    this.s += x * (v - this.m);
    this._max = Math.max(v, this._max);
    this._min = Math.min(v, this._min);
    this.total += v;
  }

  mean(): number { return this.m; }
  variance(): number { return this.n <= 1 ? 0 : this.s / (this.n - 1); }
  deviation(): number { return Math.sqrt(this.variance()); }
  max(): number { return this._max; }
  min(): number { return this._min; }
  sum(): number { return this.total; }
  size(): number { return this.n; }

  asResults(): RunningStatisticsResults {
    return {
      mean: this.mean(),
      deviation: this.deviation(),
      sum: this.sum(),
      size: this.size(),
      max: this.max(),
      min: this.min(),
    };
  }
}
