// App.jsx
import "./App.css";
import { useCryptogramGame } from "./hooks/useCryptogramGame";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import Lives from "./components/Lives";
import { useState } from "react";
import Modal from "./components/Modal";

const MESSAGE = "I FEEL DEEPLY CONNECTED WHEN WE TALK HONESTLY.";

export default function App() {
  const { board, lives, guessLetter, activeIndex, setActiveIndex, errorIndex, disabledKeys, isGameComplete, revealRandomCell } = useCryptogramGame(MESSAGE);

  const MAX_HINTS = 3;
  const [hintsUsed, setHintsUsed] = useState(0);

  const canUseHint = hintsUsed < MAX_HINTS;
  const showModal = lives === 0 || isGameComplete;


  function useHint() {
    if (!canUseHint) return;

    revealRandomCell();
    setHintsUsed(h => h + 1);
  }


  return (
    <div className="flex flex-col h-screen">
      {/* Top section */}
      <div className="shrink-0 container mx-auto p-10 max-sm:px-0">
        <Lives lives={lives} />

        {/* 👇 THIS is the important wrapper */}
        <div className="max-sm:max-h-[40vh] md:max-h-[50vh] overflow-y-auto mt-4">
          <Board
            board={board}
            onGuess={guessLetter}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            errorIndex={errorIndex}
          />
        </div>
      </div>

      {/* Middle section */}
      <div className="shrink-0 flex justify-center mt-4">
        <button
          className={`btn btn-primary ${!canUseHint ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={useHint}
          disabled={!canUseHint}
        >
          Hint
        </button>
      </div>

      {/* Bottom section */}
      <div className="mt-auto bg-white">
        <div className="container mx-auto p-4 max-sm:px-2">
          <Keyboard
            onKey={(char) => guessLetter(activeIndex, char)}
            disabledKeys={disabledKeys}
          />
        </div>
      </div>

      {/* 👇 Modal overlay */}
      {showModal && (
        <Modal
          gameResult={lives === 0 ? "Game Over!" : "You Won!"}
          gamePuzzle={isGameComplete ? MESSAGE : undefined}
        />
      )}
    </div>

  );
}
