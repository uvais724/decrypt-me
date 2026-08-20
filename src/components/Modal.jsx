//Modal.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useGameRefresh } from '../context/useGameRefresh';
import { toPng } from "html-to-image";
import { isMobile } from '../helper/helper';
import Share from './Share';
import ScoreIncrement from './ScoreIncrement';
import { gameCompletionService } from '../services/GameServices';

const confettiStyles = `
  @keyframes confettiFall {
    0% {
      transform: translate3d(0, -12%, 0) rotate(0deg);
      opacity: 0;
    }
    10% { opacity: 1; }
    100% {
      transform: translate3d(var(--drift, 0px), 130%, 0) rotate(720deg);
      opacity: 0;
    }
  }

  .confetti-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .confetti-piece {
    position: absolute;
    top: -12%;
    width: 10px;
    height: 16px;
    border-radius: 3px;
    animation: confettiFall var(--duration, 1800ms) linear infinite;
    animation-delay: var(--delay, 0ms);
    will-change: transform, opacity;
  }
`;

const CONFETTI_PIECES = [
  { left: '6%', color: '#22c55e', drift: '-28px', delay: '80ms', duration: '1800ms' },
  { left: '14%', color: '#3b82f6', drift: '24px', delay: '220ms', duration: '1900ms' },
  { left: '21%', color: '#eab308', drift: '-20px', delay: '120ms', duration: '1700ms' },
  { left: '30%', color: '#ef4444', drift: '18px', delay: '320ms', duration: '2000ms' },
  { left: '38%', color: '#14b8a6', drift: '-24px', delay: '420ms', duration: '1850ms' },
  { left: '46%', color: '#f97316', drift: '16px', delay: '540ms', duration: '1950ms' },
  { left: '55%', color: '#8b5cf6', drift: '-26px', delay: '180ms', duration: '1780ms' },
  { left: '64%', color: '#ec4899', drift: '20px', delay: '360ms', duration: '1880ms' },
  { left: '72%', color: '#06b6d4', drift: '-16px', delay: '640ms', duration: '1980ms' },
  { left: '80%', color: '#84cc16', drift: '28px', delay: '280ms', duration: '1750ms' },
  { left: '88%', color: '#f59e0b', drift: '-18px', delay: '500ms', duration: '1920ms' },
  { left: '94%', color: '#10b981', drift: '22px', delay: '700ms', duration: '2050ms' }
];

function ModalConfetti() {
  return (
    <>
      <style>{confettiStyles}</style>
      <div className="confetti-wrap" aria-hidden="true">
        {CONFETTI_PIECES.map((piece, index) => (
          <span
            key={`confetti-${index}`}
            className="confetti-piece"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              '--drift': piece.drift,
              '--delay': piece.delay,
              '--duration': piece.duration
            }}
          />
        ))}
      </div>
    </>
  );
}

export default function Modal({
  gameId,
  senderId,
  sessionId,
  gamePuzzle,
  gameResult,
  onTryAgain,
  isSinglePlayer = false,
  currentLevel = null,
  isDemo = false,
  lives,
  hintsUsed,
  isDailyPuzzle = false
}) {
  const dialogRef = useRef(null);
  const shareRef = useRef(null);
  const [scoreIncrementData, setScoreIncrementData] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerRefresh } = useGameRefresh();

  useEffect(() => {
    dialogRef.current?.showModal();

    // Prevent closing when clicking outside the modal
    const handleCancel = (e) => {
      e.preventDefault();
    };

    dialogRef.current?.addEventListener('cancel', handleCancel);

    if (gamePuzzle) {
      const updateGameStatus = async () => {
        try {
          const scoreData = await gameCompletionService.markSolved({
            gameId,
            senderId,
            receiverId: user.id,
            isSinglePlayer,
            currentLevel,
            isDailyPuzzle,
            isDemo
          });

          if (scoreData) {
            setScoreIncrementData(scoreData);
          }
        } catch (error) {
          console.error('Error updating game status:', error);
        }
      };
      updateGameStatus();
    }

    return () => {
      dialogRef.current?.removeEventListener('cancel', handleCancel);
    };
  }, []);


   const handleClose = async () => {
        // In demo mode, just navigate back to login
        if (isDemo) {
            navigate('/login');
            return;
        }

        if (isDailyPuzzle) {
          navigate('/');
          return;
        }

        if (gameResult === "Game Over!") {
          onTryAgain();
          navigate('/');
          return;
        }

        try {
            await gameCompletionService.closeFinishedGame({
              gameId,
              sessionId,
              isSinglePlayer,
              gameResult
            });
            triggerRefresh();
        } catch (error) {
            console.error("Error closing finished game:", error);
        }
        
        dialogRef.current?.close();
        navigate('/');
    };

  const handleShare = async () => {
    if (!shareRef.current) return;

    const dataUrl = await toPng(shareRef.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 2
    });

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "cryptogram-win.png", {
      type: "image/png"
    });

    if (isMobile() && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "I cracked this cryptogram 🧠🔥",
        files: [file]
      });
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "cryptogram-win.png";
      link.click();
    }

    await handleClose();
  };

  return (
    <>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box text-center relative overflow-hidden">
          {gameResult !== "Game Over!" && <ModalConfetti />}
          <h3 className="font-bold text-lg">{gameResult}</h3>

          {gamePuzzle && (
            <>
              <h3>The hidden message is</h3>
              <blockquote className="p-4 mt-2 text-xl italic font-semibold bg-gray-300">
                <p>{gamePuzzle}</p>
              </blockquote>
            </>
          )}

          {scoreIncrementData && (
            <ScoreIncrement
              previousScore={scoreIncrementData.previousScore}
              currentScore={scoreIncrementData.currentScore}
              incrementBy={scoreIncrementData.incrementBy}
              label="Pair Score"
            />
          )}

          <div className="mt-4 flex justify-center gap-4">
            {gameResult !== "Game Over!" && (
              <button className="btn btn-success" onClick={handleShare}>
                Share 🎉
              </button>
            )}

            {gameResult === "Game Over!" && !isDailyPuzzle && (
              <button className="btn" onClick={onTryAgain}>
                Try Again
              </button>
            )}

            <button className="btn" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </dialog>

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <Share
          ref={shareRef}
          gamePuzzle={gamePuzzle}
          lives={lives}
          hintsUsed={hintsUsed}
        />
      </div>
    </>
  );
}
