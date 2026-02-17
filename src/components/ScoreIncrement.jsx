import React, { useEffect, useState } from 'react';

const styles = `
  @keyframes scoreCardIn {
    0% { opacity: 0; transform: translateY(14px) scale(0.96); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes scoreGlow {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3); }
    100% { box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
  }

  .score-card {
    animation: scoreCardIn 280ms ease-out forwards;
  }

  .slot-counter {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
    animation: scoreGlow 900ms ease-out 1;
  }
`;

export default function ScoreIncrement({
  previousScore = 0,
  currentScore = 0,
  incrementBy = 1,
  label = 'Pair Score',
  className = ''
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const safePreviousScore = Number.isFinite(Number(previousScore)) ? Number(previousScore) : 0;
  const safeCurrentScore = Number.isFinite(Number(currentScore)) ? Number(currentScore) : 0;
  const safeIncrementBy = Number.isFinite(Number(incrementBy)) ? Number(incrementBy) : 1;

  useEffect(() => {
    setAnimatedScore(safePreviousScore);
    if (safeCurrentScore <= safePreviousScore) {
      setAnimatedScore(safeCurrentScore);
      return;
    }

    const durationMs = 700;
    const start = performance.now();
    let rafId = 0;

    const tick = (now) => {
      const elapsed = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const nextValue = Math.round(
        safePreviousScore + (safeCurrentScore - safePreviousScore) * eased
      );
      setAnimatedScore(nextValue);

      if (elapsed < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [safePreviousScore, safeCurrentScore]);

  return (
    <>
      <style>{styles}</style>
      <div className={`score-card mt-4 rounded-xl border border-success/30 bg-success/10 p-4 ${className}`}>
        <div className="text-xs uppercase tracking-wider text-base-content/70">{label}</div>
        <div className="mt-3 flex flex-col items-center justify-center">
          <span className="slot-counter text-4xl font-black text-success leading-none">
            {animatedScore}
          </span>
          <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-success">
            +{safeIncrementBy} added
          </span>
        </div>
      </div>
    </>
  );
}
