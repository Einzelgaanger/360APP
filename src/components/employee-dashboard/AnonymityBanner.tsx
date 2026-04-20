import { Shield, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnonymityBanner({ minRaters = 3 }: { minRaters?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-3 flex items-start gap-3 border-l-4 border-l-emerald-500"
    >
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
        <Shield className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="text-xs leading-relaxed text-foreground/80">
        <span className="font-semibold text-foreground">Your reviewers are fully anonymous.</span> Individual responses are never shown — only aggregated scores and themes.
        Categories with fewer than {minRaters} reviewers are hidden to protect identity.
      </div>
    </motion.div>
  );
}
