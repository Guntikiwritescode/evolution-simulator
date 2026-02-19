export type Point2 = [number, number];
export type Vector2 = [number, number];

export function vecSub(a: Point2, b: Point2): Vector2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function vecAdd(a: Point2, b: Vector2): Point2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function vecScale(v: Vector2, s: number): Vector2 {
  return [v[0] * s, v[1] * s];
}

export function vecNorm(v: Vector2): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

export function vecNormalize(v: Vector2): Vector2 {
  const n = vecNorm(v);
  if (n === 0) return [1, 0];
  return [v[0] / n, v[1] / n];
}

export function vecDot(a: Vector2, b: Vector2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function vecNeg(v: Vector2): Vector2 {
  return [-v[0], -v[1]];
}

export function distance(a: Point2, b: Point2): number {
  return vecNorm(vecSub(a, b));
}

export function projectToLine(r1: Point2, r2: Point2, p: Point2): Vector2 | null {
  const v = vecSub(r2, r1);
  const n = vecNormalize(v);
  const pa = vecSub(r1, p);
  const pb = vecSub(r2, p);

  const paDotN = vecDot(pa, n);
  const pbDotN = vecDot(pb, n);

  if (paDotN * pbDotN > 0) {
    return null;
  }

  return vecScale(n, -paDotN);
}

export function distanceToLine(r1: Point2, r2: Point2, p: Point2): number | null {
  const proj = projectToLine(r1, r2, p);
  if (proj === null) return null;
  const pa = vecSub(p, r1);
  return vecNorm(vecSub(proj, pa));
}

export function lerp(first: number, second: number, t: number): number {
  return first * (1 - t) + second * t;
}

export function rotateVector(v: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
}
