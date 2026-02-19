'use client';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  percent: number;
  color?: string;
  label?: string;
}

export default function ProgressBar({ percent, color = '#0072B2', label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-mono text-text-secondary">{label}</span>
          <span className="text-xs font-mono text-text-secondary">{percent.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percent)}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
