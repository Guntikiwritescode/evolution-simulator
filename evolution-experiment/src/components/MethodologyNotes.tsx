'use client';
import { motion } from 'framer-motion';
import CollapsiblePanel from './ui/CollapsiblePanel';

export default function MethodologyNotes() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <h2 className="font-serif text-2xl text-text-primary mb-8 border-b border-bg-tertiary pb-3">
        Methodology Notes
      </h2>

      <div className="space-y-4">
        <CollapsiblePanel title="Reproducibility">
          <p className="text-sm text-text-secondary leading-relaxed">
            All simulation randomness flows through a single seedable PRNG (seedrandom).
            Each run uses a sequential seed (1000&ndash;1029). Running the experiment with the
            same seeds on the same platform produces byte-identical results.
            Floating-point operations are deterministic on a single architecture.
            Creature processing order is deterministic (shuffled each step with the seeded PRNG).
          </p>
        </CollapsiblePanel>

        <CollapsiblePanel title="Limitations &amp; Caveats">
          <ul className="text-sm text-text-secondary leading-relaxed space-y-2 list-disc list-inside">
            <li>
              The simulation uses simplified 2D physics, which limits the complexity of behaviors
              that can emerge through evolution.
            </li>
            <li>
              Grid search explores only 216 trait combinations; finer resolution or Bayesian
              optimization could find better configurations.
            </li>
            <li>
              Population size (50) is small relative to real evolutionary systems, which may
              amplify genetic drift effects.
            </li>
            <li>
              Environmental shift is a single discrete change rather than gradual or continuous.
            </li>
            <li>
              JavaScript floating-point precision may differ slightly across platforms
              (though results should be consistent within a single browser session).
            </li>
          </ul>
        </CollapsiblePanel>

        <CollapsiblePanel title="How to Replicate">
          <ol className="text-sm text-text-secondary leading-relaxed space-y-2 list-decimal list-inside">
            <li>Open this page in any modern browser (Chrome, Firefox, Safari, Edge).</li>
            <li>Click &ldquo;Run Experiment&rdquo; and wait for completion.</li>
            <li>Download the CSV files from the Raw Data Export section.</li>
            <li>Verify that running the experiment again with the same configuration
              produces identical CSV output.</li>
            <li>To use different parameters, modify the experiment config (available via
              &ldquo;Copy Config JSON&rdquo;) and update the source code.</li>
          </ol>
        </CollapsiblePanel>

        <CollapsiblePanel title="Source Code">
          <p className="text-sm text-text-secondary leading-relaxed">
            The simulation engine is a faithful TypeScript port of the original Rust/WASM
            Evolution Simulator by MinuteLabs. The experiment framework, statistical analysis,
            and visualization layer were built on top of this engine.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">
            Source code is available at the project repository.
          </p>
        </CollapsiblePanel>
      </div>
    </motion.section>
  );
}
