'use client';
import { motion } from 'framer-motion';
import CollapsiblePanel from './ui/CollapsiblePanel';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function Methodology() {
  return (
    <motion.section {...fadeIn} className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="font-serif text-2xl text-text-primary mb-8 border-b border-bg-tertiary pb-3">
        Methodology
      </h2>

      <div className="space-y-4">
        <CollapsiblePanel title="Experimental Conditions" defaultOpen>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold text-accent-et">
                Condition A &mdash; Evolutionary Training (ET)
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                A population of 50 creatures begins with default traits (speed=10, size=10,
                senseRange=20, reach=1) and Gaussian mutation variances (&sigma;=1.0 for speed,
                size, senseRange; &sigma;=0.3 for reach). They evolve for 100 generations through
                natural selection: creatures that eat &ge;2 food reproduce with heritable
                mutation, those that eat &ge;1 survive, those that eat 0 die. Four
                independent traits co-evolve under selective pressure.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold text-accent-gs">
                Condition B &mdash; Grid Search Optimization (GS)
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Systematically evaluate 512 trait combinations on a fine-grained 8&times;8&times;8 grid
                (speed, size, senseRange). Deploy the best-performing configuration as 50
                identical clones with zero mutation variance for 100 generations.
                Offspring are exact copies&mdash;the population cannot adapt.
              </p>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Experimental Flow">
          <div className="py-4">
            <svg viewBox="0 0 800 200" className="w-full max-w-2xl mx-auto" aria-label="Experimental flow diagram">
              <text x="10" y="45" className="fill-[#e5e5e5] text-xs font-mono" fontSize="12">ET:</text>
              <rect x="50" y="25" width="130" height="35" rx="4" fill="none" stroke="#0072B2" strokeWidth="1.5"/>
              <text x="115" y="47" textAnchor="middle" fill="#0072B2" fontSize="11" fontFamily="IBM Plex Mono">Default Agents</text>
              <line x1="180" y1="42" x2="220" y2="42" stroke="#555" strokeWidth="1"/>
              <polygon points="218,38 226,42 218,46" fill="#555"/>
              <rect x="226" y="25" width="180" height="35" rx="4" fill="none" stroke="#0072B2" strokeWidth="1.5"/>
              <text x="316" y="47" textAnchor="middle" fill="#0072B2" fontSize="11" fontFamily="IBM Plex Mono">100 gen evolve (Env1)</text>
              <line x1="406" y1="42" x2="446" y2="42" stroke="#555" strokeWidth="1"/>
              <polygon points="444,38 452,42 444,46" fill="#555"/>
              <rect x="452" y="25" width="200" height="35" rx="4" fill="none" stroke="#0072B2" strokeWidth="1.5"/>
              <text x="552" y="47" textAnchor="middle" fill="#0072B2" fontSize="11" fontFamily="IBM Plex Mono">50 gen transfer (Env2)</text>
              <text x="10" y="145" className="fill-[#e5e5e5] text-xs font-mono" fontSize="12">GS:</text>
              <rect x="50" y="120" width="130" height="35" rx="4" fill="none" stroke="#E69F00" strokeWidth="1.5"/>
              <text x="115" y="142" textAnchor="middle" fill="#E69F00" fontSize="11" fontFamily="IBM Plex Mono">Grid Search 512</text>
              <line x1="180" y1="137" x2="220" y2="137" stroke="#555" strokeWidth="1"/>
              <polygon points="218,133 226,137 218,141" fill="#555"/>
              <rect x="226" y="120" width="180" height="35" rx="4" fill="none" stroke="#E69F00" strokeWidth="1.5"/>
              <text x="316" y="142" textAnchor="middle" fill="#E69F00" fontSize="11" fontFamily="IBM Plex Mono">Best clones 100 gen (Env1)</text>
              <line x1="406" y1="137" x2="446" y2="137" stroke="#555" strokeWidth="1"/>
              <polygon points="444,133 452,137 444,141" fill="#555"/>
              <rect x="452" y="120" width="200" height="35" rx="4" fill="none" stroke="#E69F00" strokeWidth="1.5"/>
              <text x="552" y="142" textAnchor="middle" fill="#E69F00" fontSize="11" fontFamily="IBM Plex Mono">50 gen transfer (Env2)</text>
            </svg>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Hypotheses">
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8321;</span>
              <span><strong className="text-text-primary">Efficiency:</strong> By generation 100, ET achieves per-agent food consumption not statistically inferior to GS (one-sided, &alpha;=0.05, Bonferroni-corrected).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8322;</span>
              <span><strong className="text-text-primary">Generalization:</strong> In the transfer phase, ET shows a significantly smaller fitness drop (generalization gap) than GS (two-sided t-test, &alpha;=0.05).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8323;</span>
              <span><strong className="text-text-primary">Diversity:</strong> ET maintains significantly higher trait diversity (CV&sup2; sum and Shannon H) throughout the experiment (&alpha;=0.05).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8324;</span>
              <span><strong className="text-text-primary">Adaptation:</strong> Over the 50 transfer generations, ET&apos;s fitness trend slope is significantly more positive than GS&apos;s (linear regression, two-sided t-test on per-run slopes).</span>
            </li>
          </ul>
        </CollapsiblePanel>

        <CollapsiblePanel title="Environments">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-bg-tertiary text-text-muted">
                  <th className="text-left py-2 pr-4">Parameter</th>
                  <th className="text-right py-2 px-4">Env 1 (Baseline)</th>
                  <th className="text-right py-2 pl-4">Env 2 (Shifted)</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">World Size</td><td className="text-right px-4">500 &times; 500</td><td className="text-right pl-4">800 &times; 800</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Food / Generation</td><td className="text-right px-4">50</td><td className="text-right pl-4">30</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Enabled Edges</td><td className="text-right px-4">4 (all)</td><td className="text-right pl-4">2 (edges 0, 1)</td></tr>
                <tr><td className="py-2 pr-4">Cannibalism Ratio</td><td className="text-right px-4">0.8</td><td className="text-right pl-4">0.8</td></tr>
              </tbody>
            </table>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Experiment Parameters">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-bg-tertiary text-text-muted">
                  <th className="text-left py-2 pr-4">Parameter</th>
                  <th className="text-right py-2 px-4">Value</th>
                  <th className="text-left py-2 pl-4">Justification</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Training generations</td><td className="text-right px-4">100</td><td className="pl-4 text-xs">Robust convergence; captures equilibrium dynamics</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Transfer generations</td><td className="text-right px-4">50</td><td className="pl-4 text-xs">Half of training; sufficient for recovery measurement</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">N_RUNS</td><td className="text-right px-4">30</td><td className="pl-4 text-xs">Adequate for CLT; df=29 for t-critical &asymp; 2.045</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Population</td><td className="text-right px-4">50</td><td className="pl-4 text-xs">Balances diversity with computational tractability</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Seeds</td><td className="text-right px-4">1000&ndash;1029</td><td className="pl-4 text-xs">Sequential deterministic seeds for full reproducibility</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Mutation &sigma; (speed, size, sense)</td><td className="text-right px-4">1.0</td><td className="pl-4 text-xs">10% of default value; enables meaningful phenotypic variation</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Mutation &sigma; (reach)</td><td className="text-right px-4">0.3</td><td className="pl-4 text-xs">Proportional to default reach value</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Grid search resolution</td><td className="text-right px-4">8&times;8&times;8 = 512</td><td className="pl-4 text-xs">Fine-grained search; fair baseline for GS condition</td></tr>
                <tr><td className="py-2 pr-4">Multiple comparison correction</td><td className="text-right px-4">Bonferroni</td><td className="pl-4 text-xs">Conservative control for family-wise error rate</td></tr>
              </tbody>
            </table>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Statistical Analysis">
          <div className="text-sm text-text-secondary leading-relaxed space-y-2">
            <p>
              All hypothesis tests use Welch&apos;s t-test (unequal variances assumed) with
              Bonferroni correction for 10 simultaneous comparisons. Effect sizes reported
              as Cohen&apos;s d with standard thresholds (small: 0.2, medium: 0.5, large: 0.8).
              Mann-Whitney U tests provide non-parametric confirmation.
            </p>
            <p>
              Adaptation trends (H&#8324;) are quantified via ordinary least-squares regression of
              mean fitness over transfer generations, computed independently for each run.
              Per-run slopes are then compared across conditions using Welch&apos;s t-test.
            </p>
            <p>
              Diversity is measured two ways: (1) coefficient of variation squared (CV&sup2;) summed
              across speed, size, senseRange, and reach; (2) Shannon entropy (H) on 10-bin
              discretization of the joint trait distribution.
            </p>
          </div>
        </CollapsiblePanel>
      </div>
    </motion.section>
  );
}
