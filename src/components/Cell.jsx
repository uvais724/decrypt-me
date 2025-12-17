// components/Cell.jsx
export default function Cell({ cell, isActive, onGuess, onFocus, isError }) {

  return (
    <div className="flex flex-col items-center mx-1">
      <input readOnly
        className={`w-8 h-8 text-center border focus:outline-none
        ${isActive ? "border-blue-500" : ""}
        ${cell.revealed ? "bg-green-200" : ""} focus:border-blue-500
        ${isError ? "border-red-500": ""}`}
        disabled={cell.revealed}
        maxLength={1}
        value={cell.revealed ? cell.letter : undefined}
        onFocus={onFocus}
        onClick={onFocus}
        onChange={(e) =>
          onGuess(cell.index, e.target.value.toUpperCase())
        }
      />
      <span>{cell.value}</span>
    </div>
  );
}
