'use client';
import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
          bg-bg-secondary border border-bg-tertiary rounded text-xs text-text-secondary
          whitespace-nowrap z-50 pointer-events-none">
          {content}
        </span>
      )}
    </span>
  );
}
