import "./App.css";
import { useCryptogramGame } from "./hooks/useCryptogramGame";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import Lives from "./components/Lives";

const MESSAGE = "I FEEL DEEPLY CONNECTED WHEN WE TALK HONESTLY.";

export default function App() {
  const { board, lives, guessLetter, activeIndex, setActiveIndex, errorIndex, disabledKeys } = useCryptogramGame(MESSAGE);

  if (lives === 0) {
    return <h1 className="text-center text-3xl">Game Over</h1>;
  }

  return (
    <div className="container mx-auto p-10">
      <Lives lives={lives} />
      <Board board={board} onGuess={guessLetter} activeIndex={activeIndex} setActiveIndex={setActiveIndex} errorIndex={errorIndex} />
      <Keyboard onKey={(char) => guessLetter(activeIndex, char)} disabledKeys={disabledKeys} />
    </div>
  );
}
