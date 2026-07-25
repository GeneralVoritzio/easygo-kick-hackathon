import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Link2 } from 'lucide-react';

interface SharePanelProps {
  onClose: () => void;
}

/** A minimal share sheet: copies the current page URL. The only real
 *  action of the three bubble options — there's a real clipboard, so no
 *  need to mock it. */
export function SharePanel({ onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-page/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <h2 className="mb-3 text-sm font-extrabold text-ink-bright">Share this stream</h2>

        <button
          type="button"
          onClick={handleCopy}
          className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left active:border-kick"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info/15 text-info">
            {copied ? <Check size={16} strokeWidth={2.25} /> : <Link2 size={16} strokeWidth={2.25} />}
          </span>
          <span className="text-xs font-semibold text-ink-bright">{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
      </motion.div>
    </>
  );
}
