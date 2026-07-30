import { useEffect, useRef, useState } from 'react';
import { streamExplanation, fallbackExplanation } from '../services/anthropicService.js';
import GuideAvatar from './GuideAvatar.jsx';

export default function BiteExplanation({ open, onClose, args }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | streaming | done | fallback
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open || !args) return;
    setText('');
    setStatus('streaming');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    streamExplanation(args, (chunk) => setText(prev => prev + chunk), ctrl.signal)
      .then(() => setStatus('done'))
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        console.error('[anthropic]', e.message);
        setText(fallbackExplanation(args.species, args.score, args.zone));
        setStatus('fallback');
      });

    return () => ctrl.abort();
  }, [open, args]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-bg/70 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="bg-surface border border-edge rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <header className="flex items-center justify-between px-5 py-3 border-b border-edge sticky top-0 bg-surface">
          <div className="flex items-center gap-3">
            <GuideAvatar size={72} />
            <div>
              <h3 className="font-display text-lg font-semibold text-heading uppercase tracking-wide">
                {args?.species} · The Guide's Read
              </h3>
              <p className="text-xs text-body/70">
                {status === 'streaming' && 'Your guide is thinking…'}
                {status === 'done' && 'Live read · powered by Anthropic'}
                {status === 'fallback' && 'Offline summary — live guide unavailable.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-body hover:text-heading text-xl leading-none px-2"
            aria-label="Close"
          >×</button>
        </header>
        <div className="px-5 py-4 text-body leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
          {text || <span className="text-body/60">Loading explanation…</span>}
        </div>
      </div>
    </div>
  );
}
