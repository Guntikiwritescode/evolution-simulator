'use client';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto text-center py-16 px-6"
    >
      <p className="text-xs font-mono tracking-[0.3em] text-text-muted uppercase mb-6">
        Companion Experiment
      </p>
      <h1 className="font-serif text-4xl md:text-5xl font-light text-text-primary leading-tight mb-4">
        Evolutionary Adaptation<br />
        <span className="text-text-secondary">vs.</span>{' '}
        Static Optimization
      </h1>
      <p className="font-serif text-lg text-text-secondary mt-6 mb-2 italic">
        Companion experiment for &ldquo;Evolving (Artificial) Intelligence&rdquo;
      </p>
      <p className="text-sm font-sans text-text-muted">
        by Abhinav R. Guntaka
      </p>

      <div className="mt-10 max-w-2xl mx-auto text-left">
        <p className="text-sm leading-relaxed text-text-secondary font-sans">
          This experiment provides small-scale empirical evidence that evolutionary selection
          produces agents which are more robust to environmental change than agents found through
          exhaustive parameter optimization. We compare two methods&mdash;evolutionary training (ET)
          and grid search optimization (GS)&mdash;across a baseline and a shifted environment,
          measuring fitness, diversity, and generalization capacity across 30 independent replications.
        </p>
      </div>
    </motion.header>
  );
}
