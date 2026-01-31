import React from "react";

export default function Keyboard({
  onKey,
  disabledKeys,
  partiallyRevealedKeys,
  cryptogramNumbers
}) {
  const keys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

  return (
    <div className="flex flex-wrap justify-center gap-2 max-sm:gap-1.5">
      {keys.map((k) => {
        const number = cryptogramNumbers?.[k];

        return (
          <React.Fragment key={k}>
            <button
              onClick={() => onKey(k)}
              disabled={disabledKeys.has(k)}
              className={`
                relative border px-4 py-2 max-sm:px-0 max-sm:min-w-7 rounded
                ${disabledKeys.has(k) ? "border-gray-200 text-gray-400" : ""}
                ${
                  partiallyRevealedKeys.has(k)
                    ? "bg-green-100 border-green-500 text-green-700"
                    : ""
                }
              `}
            >
              {/* Letter */}
              <span className="text-lg font-semibold">{k}</span>

              {/* Cryptogram number */}
              {number && partiallyRevealedKeys.has(k) && (
                <span className="absolute top-0 right-1 text-xs text-green-700">
                  {number}
                </span>
              )}
            </button>

            {(k === "P" || k === "L") && <div className="w-full" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
