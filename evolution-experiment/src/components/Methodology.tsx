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
                senseRange=20, variance=0.5). They evolve for 50 generations through natural
                selection: creatures that eat &ge;2 food reproduce with Gaussian mutation,
                those that eat &ge;1 survive, those that eat 0 die.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold text-accent-gs">
                Condition B &mdash; Grid Search Optimization (GS)
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Systematically evaluate 216 trait combinations (speed, size, senseRange) on a grid.
                Deploy the best-performing configuration as 50 identical clones with zero mutation
                variance for 50 generations. Offspring are exact copies of parents.
              </p>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Experimental Flow">
          <div className="py-4">
            <svg viewBox="0 0 800 200" className="w-full max-w-2xl mx-auto" aria-label="Experimental flow diagram">
              {/* ET flow */}
              <text x="10" y="45" className="fill-[#e5e5e5] text-xs font-mono" fontSize="12">ET:</text>
              <rect x="50" y="25" width="130" height="35" rx="4" fill="none" stroke="#0072B2" strokeWidth="1.5"/>
              <text x="115" y="47" textAnchor="middle" fill="#0072B2" fontSize="11" fontFamily="IBM Plex Mono">Default Agents</text>
              <line x1="180" y1="42" x2="220" y2="42" stroke="#555" strokeWidth="1"/>
              <polygon points="218,38 226,42 218,46" fill="#555"/>
              <rect x="226" y="25" width="180" height="35" rx="4" fill="none" stroke="#0072B2" strokeWidth="1.5"/>
              <text x="316" y="47" textAnchor="middle" fill="#0072B2" fontSize="11" fontFamily="IBM Plex Mono">50 gen evolution (Env1)</text>
              <line x1="406" y1="42" x2="446" y2="42" stroke="#555" strokeWidth="1"/>
              <polygon points="444,38 452,42 444,46" fill="#555"/>
              <rect x="452" y="25" width="200" height="35" rx="4" fill="none" stroke="#0072B2" strokeWidth="1.5"/>
              <text x="552" y="47" textAnchor="middle" fill="#0072B2" fontSize="11" fontFamily="IBM Plex Mono">25 gen transfer (Env2)</text>

              {/* GS flow */}
              <text x="10" y="145" className="fill-[#e5e5e5] text-xs font-mono" fontSize="12">GS:</text>
              <rect x="50" y="120" width="130" height="35" rx="4" fill="none" stroke="#E69F00" strokeWidth="1.5"/>
              <text x="115" y="142" textAnchor="middle" fill="#E69F00" fontSize="11" fontFamily="IBM Plex Mono">Grid Search 216</text>
              <line x1="180" y1="137" x2="220" y2="137" stroke="#555" strokeWidth="1"/>
              <polygon points="218,133 226,137 218,141" fill="#555"/>
              <rect x="226" y="120" width="180" height="35" rx="4" fill="none" stroke="#E69F00" strokeWidth="1.5"/>
              <text x="316" y="142" textAnchor="middle" fill="#E69F00" fontSize="11" fontFamily="IBM Plex Mono">Best clones 50 gen (Env1)</text>
              <line x1="406" y1="137" x2="446" y2="137" stroke="#555" strokeWidth="1"/>
              <polygon points="444,133 452,137 444,141" fill="#555"/>
              <rect x="452" y="120" width="200" height="35" rx="4" fill="none" stroke="#E69F00" strokeWidth="1.5"/>
              <text x="552" y="142" textAnchor="middle" fill="#E69F00" fontSize="11" fontFamily="IBM Plex Mono">25 gen transfer (Env2)</text>
            </svg>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Hypotheses">
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8321;</span>
              <span><strong className="text-text-primary">Efficiency:</strong> By generation 50, ET achieves per-agent food consumption not statistically inferior to GS (&alpha;=0.05).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8322;</span>
              <span><strong className="text-text-primary">Generalization:</strong> In the transfer phase, ET shows a significantly smaller fitness drop than GS (two-sided t-test, &alpha;=0.05).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8323;</span>
              <span><strong className="text-text-primary">Diversity:</strong> ET maintains significantly higher trait diversity throughout (&alpha;=0.05).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-text-muted shrink-0">H&#8324;</span>
              <span><strong className="text-text-primary">Adaptation:</strong> Over the 25 transfer generations, ET fitness shows a positive trend while GS shows flat or negative.</span>
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
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">G (training gen)</td><td className="text-right px-4">50</td><td className="pl-4 text-xs">Sufficient for trait convergence</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">N_RUNS</td><td className="text-right px-4">30</td><td className="pl-4 text-xs">Standard for parametric tests</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Population</td><td className="text-right px-4">50</td><td className="pl-4 text-xs">Matches original simulator</td></tr>
                <tr className="border-b border-bg-tertiary/50"><td className="py-2 pr-4">Seeds</td><td className="text-right px-4">1000&ndash;1029</td><td className="pl-4 text-xs">Sequential for reproducibility</td></tr>
                <tr><td className="py-2 pr-4">Transfer gen</td><td className="text-right px-4">25</td><td className="pl-4 text-xs">Half of training period</td></tr>
              </tbody>
            </table>
          </div>
        </CollapsiblePanel>
      </div>
    </motion.section>
  );
}
