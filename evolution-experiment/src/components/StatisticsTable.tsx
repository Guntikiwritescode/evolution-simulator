'use client';
import type { FullComparisonResult } from '../lib/experiment/statistics';
import { fmt, fmtP, significanceStars, fmtMeanSD } from '../lib/utils/format';

interface Row {
  metric: string;
  result: FullComparisonResult;
}

interface StatisticsTableProps {
  rows: Row[];
  title?: string;
}

export default function StatisticsTable({ rows, title = 'Statistical Summary' }: StatisticsTableProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
      <h3 className="font-serif text-base text-text-primary mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-bg-tertiary text-text-muted">
              <th className="text-left py-2 pr-3">Metric</th>
              <th className="text-right py-2 px-2">ET (M &plusmn; SD)</th>
              <th className="text-right py-2 px-2">GS (M &plusmn; SD)</th>
              <th className="text-right py-2 px-2">t</th>
              <th className="text-right py-2 px-2">df</th>
              <th className="text-right py-2 px-2">p</th>
              <th className="text-right py-2 px-2">Cohen&apos;s d</th>
              <th className="text-left py-2 pl-2">Interp.</th>
              <th className="text-center py-2 pl-2">Sig.</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-bg-tertiary/50 hover:bg-bg-tertiary/30 transition-colors">
                <td className="py-2 pr-3 text-text-primary whitespace-nowrap">{row.metric}</td>
                <td className="text-right py-2 px-2 whitespace-nowrap">
                  {fmtMeanSD(row.result.etStats.mean, row.result.etStats.sd)}
                </td>
                <td className="text-right py-2 px-2 whitespace-nowrap">
                  {fmtMeanSD(row.result.gsStats.mean, row.result.gsStats.sd)}
                </td>
                <td className="text-right py-2 px-2">{fmt(row.result.tTest.t, 3)}</td>
                <td className="text-right py-2 px-2">{fmt(row.result.tTest.df, 1)}</td>
                <td className="text-right py-2 px-2">{fmtP(row.result.tTest.p)}</td>
                <td className="text-right py-2 px-2">{fmt(row.result.tTest.cohensD, 3)}</td>
                <td className="text-left py-2 pl-2 text-text-muted">{row.result.tTest.interpretation}</td>
                <td className="text-center py-2 pl-2">
                  <span className={row.result.tTest.p < 0.05 ? 'text-green-400' : 'text-text-muted'}>
                    {significanceStars(row.result.tTest.p)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
