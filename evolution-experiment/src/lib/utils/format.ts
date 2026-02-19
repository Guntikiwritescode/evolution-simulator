export function fmt(n: number, decimals: number = 2): string {
  if (isNaN(n) || !isFinite(n)) return '\u2014';
  return n.toFixed(decimals);
}

export function fmtP(p: number): string {
  if (p < 0.001) return '< .001';
  if (p < 0.01) return p.toFixed(3);
  return p.toFixed(3);
}

export function significanceStars(p: number): string {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  return 'ns';
}

export function fmtMeanSD(mean: number, sd: number): string {
  return `${fmt(mean)} \u00B1 ${fmt(sd)}`;
}

export function fmtSlope(slope: number): string {
  if (slope > 0) return `+${fmt(slope, 4)}`;
  return fmt(slope, 4);
}
