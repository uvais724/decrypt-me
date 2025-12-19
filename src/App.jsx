// App.jsx
import "./App.css";
import { useCryptogramGame } from "./hooks/useCryptogramGame";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import Lives from "./components/Lives";
import { useState } from "react";

const MESSAGE = "I FEEL DEEPLY CONNECTED WHEN WE TALK HONESTLY.";

export default function App() {
  const { board, lives, guessLetter, activeIndex, setActiveIndex, errorIndex, disabledKeys, isGameComplete, revealRandomCell } = useCryptogramGame(MESSAGE);

  const MAX_HINTS = 3;
  const [hintsUsed, setHintsUsed] = useState(0);

  const canUseHint = hintsUsed < MAX_HINTS;


  if (lives === 0) {
    return <h1 className="text-center text-3xl">Game Over</h1>;
  }

  if (isGameComplete) {
    return <h1 className="text-center text-3xl">You Won!</h1>;
  }

  function useHint() {
    if (!canUseHint) return;

    revealRandomCell();
    setHintsUsed(h => h + 1);
  }


  return (
    <div className="flex flex-col h-screen">
      {/* Top section with Board and Lives */}
      <div className="shrink-0">
        <div className="container mx-auto p-10 max-sm:px-0">
          <Lives lives={lives} />
          <Board board={board} onGuess={guessLetter} activeIndex={activeIndex} setActiveIndex={setActiveIndex} errorIndex={errorIndex} />
        </div>
      </div>

      {/* Middle section - expands to push content down */}
      <div className="grow overflow-auto">
        <div className="flex gap-4 justify-between mt-4 mx-8">
          <span></span>
          <button className={`border p-2 rounded-lg ${!canUseHint ? 'border-gray-200 text-gray-400' : ''}`} onClick={useHint}>
            Hint
          </button>
        </div>
      </div>

      {/* Bottom section with Keyboard and buttons */}
      <div className="shrink-0 bg-white">
        <div className="container mx-auto p-4 max-sm:px-2">
          <Keyboard onKey={(char) => guessLetter(activeIndex, char)} disabledKeys={disabledKeys} />
        </div>
      </div>
    </div>
  );
}
