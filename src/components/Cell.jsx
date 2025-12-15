// components/Cell.jsx
export default function Cell({ cell, isActive, onGuess }) {
  return (
    <div className="flex flex-col items-center mx-1">
      <input
        className={`w-8 h-8 text-center border
        ${isActive ? "border-blue-500" : ""}
        ${cell.revealed ? "bg-green-200" : ""}`}
        disabled={cell.revealed}
        maxLength={1}
        value={cell.revealed ? cell.letter : undefined}
        onChange={(e) =>
          onGuess(cell.index, e.target.value.toUpperCase())
        }
      />
      <span>{cell.value}</span>
    </div>
  );
}
