import lion from '@/assets/mascot-lion.png';
import elephant from '@/assets/mascot-elephant.png';
import cheetah from '@/assets/mascot-cheetah.png';
import owl from '@/assets/mascot-owl.png';
import rhino from '@/assets/mascot-rhino.png';
import eagle from '@/assets/mascot-eagle.png';
import { cn } from '@/lib/utils';

export type MascotKey = 'lion' | 'elephant' | 'cheetah' | 'owl' | 'rhino' | 'eagle';

export const MASCOTS: Record<MascotKey, { src: string; name: string; trait: string; tagline: string }> = {
  lion:     { src: lion,     name: 'Lion',     trait: 'Leadership', tagline: 'Leads from the front.' },
  elephant: { src: elephant, name: 'Elephant', trait: 'Wisdom',     tagline: 'Remembers, weighs, decides.' },
  cheetah:  { src: cheetah,  name: 'Cheetah',  trait: 'Speed',      tagline: 'Ships before the meeting ends.' },
  owl:      { src: owl,      name: 'Owl',      trait: 'Insight',    tagline: 'Sees the pattern others miss.' },
  rhino:    { src: rhino,    name: 'Rhino',    trait: 'Resilience', tagline: 'Pushes through. Doesn\'t flinch.' },
  eagle:    { src: eagle,    name: 'Eagle',    trait: 'Vision',     tagline: 'Reads the whole horizon.' },
};

/** Map a competency theme name → an archetype mascot. */
export function mascotForCompetency(theme?: string): MascotKey {
  if (!theme) return 'lion';
  const t = theme.toLowerCase();
  if (t.includes('lead') || t.includes('direction') || t.includes('clear goal')) return 'lion';
  if (t.includes('mentor') || t.includes('coach') || t.includes('rapport') || t.includes('humble') || t.includes('patient')) return 'elephant';
  if (t.includes('urgency') || t.includes('result') || t.includes('execut')) return 'cheetah';
  if (t.includes('analyz') || t.includes('idea') || t.includes('open') || t.includes('insight')) return 'owl';
  if (t.includes('confidence') || t.includes('integrity') || t.includes('approach')) return 'rhino';
  if (t.includes('vision') || t.includes('strateg') || t.includes('change') || t.includes('empower') || t.includes('final say')) return 'eagle';
  return 'lion';
}

type MascotProps = {
  mascot: MascotKey;
  size?: number;
  wave?: boolean;
  className?: string;
};

/** Brutalist mascot sticker. Optional wave animation. */
export function Mascot({ mascot, size = 96, wave = false, className }: MascotProps) {
  const m = MASCOTS[mascot];
  return (
    <img
      src={m.src}
      alt={`${m.name} — ${m.trait}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size }}
      className={cn('object-contain select-none pointer-events-none', wave && 'mascot-wave', className)}
    />
  );
}
