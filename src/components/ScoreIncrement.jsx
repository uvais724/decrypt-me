import React, { useEffect, useState } from 'react';

const styles = `
  @keyframes scoreCardIn {
    0% { opacity: 0; transform: translateY(14px) scale(0.96); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes scorePlusPop {
    0% { opacity: 0; transform: translateY(6px) scale(0.85); }
    30% { opacity: 1; transform: translateY(-2px) scale(1.08); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  .score-card {
    animation: scoreCardIn 280ms ease-out forwards;
  }

  .score-plus {
    animation: scorePlusPop 420ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
  }
`;

export default function ScoreIncrement({
  previousScore = 0,
  currentScore = 0,
  incrementBy = 1,
  label = 'Pair Score',
  className = ''
}) {
  const [animate, setAnimate] = useState(false);
  const safePreviousScore = Number.isFinite(Number(previousScore)) ? Number(previousScore) : 0;
  const safeCurrentScore = Number.isFinite(Number(currentScore)) ? Number(currentScore) : 0;
  const safeIncrementBy = Number.isFinite(Number(incrementBy)) ? Number(incrementBy) : 1;

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className={`score-card mt-4 rounded-xl border border-success/30 bg-success/10 p-4 ${className}`}>
        <div className="text-xs uppercase tracking-wider text-base-content/70">{label}</div>
        <div className="mt-2 flex items-center justify-center gap-3 text-xl font-bold">
          <span className="text-base-content/70">{safePreviousScore}</span>
          <span className={`rounded-full bg-success px-3 py-1 text-sm text-success-content ${animate ? 'score-plus' : 'opacity-0'}`}>
            +{safeIncrementBy}
          </span>
          <span className="text-success">{safeCurrentScore}</span>
        </div>
      </div>
    </>
  );
}
