import seedrandom from 'seedrandom';

export class RNG {
  private prng: seedrandom.PRNG;

  constructor(seed: string | number) {
    this.prng = seedrandom(String(seed));
  }

  random(min: number = 0, max: number = 1): number {
    return min + this.prng() * (max - min);
  }

  gaussian(mean: number, stddev: number): number {
    // Box-Muller transform
    let u1 = this.prng();
    let u2 = this.prng();
    while (u1 === 0) u1 = this.prng();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stddev;
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.prng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
