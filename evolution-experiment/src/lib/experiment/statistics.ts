export interface DescriptiveStats {
  mean: number;
  sd: number;
  median: number;
  ci95Lower: number;
  ci95Upper: number;
  n: number;
}

export interface TTestResult {
  t: number;
  df: number;
  p: number;
  pBonferroni: number;
  cohensD: number;
  interpretation: string;
}

export interface MannWhitneyResult {
  U: number;
  z: number;
  p: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  slopeP: number;
}

export interface FullComparisonResult {
  etStats: DescriptiveStats;
  gsStats: DescriptiveStats;
  tTest: TTestResult;
  mannWhitney: MannWhitneyResult;
}

let _numComparisons = 1;
export function setNumComparisons(n: number) { _numComparisons = n; }

const T_CRITICAL_TABLE: Record<number, number> = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
  40: 2.021, 50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984,
  120: 1.980, 1000: 1.962,
};

function getTCritical(df: number): number {
  const rounded = Math.round(df);
  if (T_CRITICAL_TABLE[rounded] !== undefined) return T_CRITICAL_TABLE[rounded];
  const keys = Object.keys(T_CRITICAL_TABLE).map(Number).sort((a, b) => a - b);
  let lower = keys[0], upper = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= rounded && keys[i + 1] >= rounded) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }
  const lv = T_CRITICAL_TABLE[lower];
  const uv = T_CRITICAL_TABLE[upper];
  if (lower === upper) return lv;
  const t = (rounded - lower) / (upper - lower);
  return lv + t * (uv - lv);
}

function tDistPValue(t: number, df: number): number {
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  return incompleteBeta(x, a, b);
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

  let f = 1, c = 1, d = 0;
  for (let i = 0; i <= 200; i++) {
    let m = Math.floor(i / 2);
    let numerator: number;
    if (i === 0) {
      numerator = 1;
    } else if (i % 2 === 0) {
      numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    } else {
      numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    }
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= c * d;
    if (Math.abs(c * d - 1) < 1e-8) break;
  }
  return front * (f - 1);
}

function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function normalCdf(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function median(data: number[]): number {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  return n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
}

export function descriptiveStats(data: number[]): DescriptiveStats {
  const n = data.length;
  if (n === 0) return { mean: 0, sd: 0, median: 0, ci95Lower: 0, ci95Upper: 0, n: 0 };

  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = n > 1
    ? data.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)
    : 0;
  const sd = Math.sqrt(variance);
  const tCrit = getTCritical(Math.max(1, n - 1));
  const se = sd / Math.sqrt(n);
  return { mean, sd, median: median(data), ci95Lower: mean - tCrit * se, ci95Upper: mean + tCrit * se, n };
}

export function welchTTest(a: number[], b: number[]): TTestResult {
  const n1 = a.length;
  const n2 = b.length;
  if (n1 === 0 || n2 === 0) return { t: 0, df: 1, p: 1, pBonferroni: 1, cohensD: 0, interpretation: 'N/A' };

  const m1 = a.reduce((s, v) => s + v, 0) / n1;
  const m2 = b.reduce((s, v) => s + v, 0) / n2;
  const v1 = n1 > 1 ? a.reduce((s, v) => s + (v - m1) ** 2, 0) / (n1 - 1) : 0;
  const v2 = n2 > 1 ? b.reduce((s, v) => s + (v - m2) ** 2, 0) / (n2 - 1) : 0;

  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = se > 0 ? (m1 - m2) / se : 0;

  const num = (v1 / n1 + v2 / n2) ** 2;
  const denom = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1);
  const df = denom > 0 ? num / denom : 1;

  const p = tDistPValue(t, df);
  const pBonf = Math.min(1, p * _numComparisons);

  const pooledVar = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
  const pooledSd = Math.sqrt(pooledVar);
  const d = pooledSd > 0 ? (m1 - m2) / pooledSd : 0;
  const absD = Math.abs(d);

  let interpretation: string;
  if (absD < 0.2) interpretation = 'negligible';
  else if (absD < 0.5) interpretation = 'small';
  else if (absD < 0.8) interpretation = 'medium';
  else interpretation = 'large';

  return { t, df, p, pBonferroni: pBonf, cohensD: d, interpretation };
}

export function mannWhitneyU(a: number[], b: number[]): MannWhitneyResult {
  const n1 = a.length;
  const n2 = b.length;
  if (n1 === 0 || n2 === 0) return { U: 0, z: 0, p: 1 };

  const combined: { value: number; group: number }[] = [
    ...a.map(v => ({ value: v, group: 0 })),
    ...b.map(v => ({ value: v, group: 1 })),
  ];
  combined.sort((x, y) => x.value - y.value);

  const ranks = new Array(combined.length);
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length && combined[j].value === combined[i].value) j++;
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) ranks[k] = avgRank;
    i = j;
  }

  let R1 = 0;
  for (let k = 0; k < combined.length; k++) {
    if (combined[k].group === 0) R1 += ranks[k];
  }

  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);

  const mU = (n1 * n2) / 2;
  const sigmaU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = sigmaU > 0 ? (U - mU) / sigmaU : 0;
  const p = 2 * normalCdf(-Math.abs(z));

  return { U, z, p };
}

export function linearRegression(y: number[]): LinearRegressionResult {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, slopeP: 1 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += y[i];
    sumXY += i * y[i];
    sumX2 += i * i;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  const denom = sumX2 - n * meanX * meanX;
  const slope = denom !== 0 ? (sumXY - n * meanX * meanY) / denom : 0;
  const intercept = meanY - slope * meanX;

  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (y[i] - meanY) ** 2;
    ssRes += (y[i] - (intercept + slope * i)) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const slopeP = n > 2 ? slopePValue(slope, ssRes, denom, n) : 1;
  return { slope, intercept, r2, slopeP };
}

function slopePValue(slope: number, ssRes: number, sxx: number, n: number): number {
  if (n <= 2 || sxx === 0) return 1;
  const mse = ssRes / (n - 2);
  const seBeta = Math.sqrt(mse / sxx);
  if (seBeta === 0) return slope === 0 ? 1 : 0;
  const tStat = slope / seBeta;
  return tDistPValue(tStat, n - 2);
}

export function compareConditions(etValues: number[], gsValues: number[]): FullComparisonResult {
  return {
    etStats: descriptiveStats(etValues),
    gsStats: descriptiveStats(gsValues),
    tTest: welchTTest(etValues, gsValues),
    mannWhitney: mannWhitneyU(etValues, gsValues),
  };
}
