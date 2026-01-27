// components/Cell.jsx
import { useEffect, useRef } from "react";

export default function Cell({ cell, isActive, onGuess, onFocus, isError }) {

  const ref = useRef(null);

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [isActive]);

  return (
    <div className="flex flex-col items-center mx-1">
      <input 
        ref={ref}
        readOnly
        className={`w-8 h-8 text-center border-2 rounded-md focus:outline-none
        ${isActive ? "border-blue-500" : "border-gray-500"}
        ${cell.revealed ? "bg-green-200" : ""} focus:border-blue-500
        ${isError ? "border-red-500": ""}`}
        disabled={cell.revealed}
        maxLength={1}
        value={cell.revealed ? cell.letter : ""}
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
