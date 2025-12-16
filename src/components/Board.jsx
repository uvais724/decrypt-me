// components/Board.jsx
import Cell from "./Cell";

export default function Board({ board, onGuess, activeIndex, setActiveIndex }) {
  return (
    <div className="flex justify-center flex-wrap my-5">
      {board.map((cell, index) =>
        cell.letter === " " || !/[A-Z]/.test(cell.letter) ? (
          <span key={index} className="text-4xl px-4">
            {cell.letter}
          </span>
        ) : (
          <Cell key={`cell-${index}`} cell={cell} isActive={index === activeIndex} onGuess={onGuess} onFocus={() => setActiveIndex(cell.index)} />
        )
      )}
    </div>
  );
}
