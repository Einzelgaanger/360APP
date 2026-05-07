import { useEffect, useState } from 'react';

/**
 * Progressive skeleton feel: snappy pulse at first, calmer rhythm after ~450ms if still loading.
 */
export function useSkeletonPhase(isActive: boolean): 'idle' | 'fast' | 'slow' {
  const [phase, setPhase] = useState<'idle' | 'fast' | 'slow'>('idle');

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }
    setPhase('fast');
    const t = window.setTimeout(() => setPhase('slow'), 450);
    return () => window.clearTimeout(t);
  }, [isActive]);

  return phase;
}

export function skeletonPhaseClass(phase: 'idle' | 'fast' | 'slow'): string {
  if (phase === 'idle') return '';
  return phase === 'fast' ? 'skeleton-pulse-fast' : 'skeleton-pulse-slow';
}
