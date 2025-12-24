// components/Keyboard.jsx
import React from "react";

export default function Keyboard({ onKey, disabledKeys }) {
  const keys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {keys.map((k) => (
        <React.Fragment  key={k}>
          <button
            key={k}
            onClick={() => onKey(k)}
            className={`border px-4 py-2 max-sm:px-2 rounded ${disabledKeys.has(k) ? 'border-gray-200 text-gray-400' : ''} `}
            disabled={disabledKeys.has(k)}
          >
            {k}
          </button>
          {(k === "P" || k === 'L') && <div className="w-full" />}
        </React.Fragment>
      ))}
    </div>
  );
}
