import React, { forwardRef } from "react";

const Share = forwardRef(({ gamePuzzle, lives, hintsUsed }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white p-6 rounded-xl shadow-xl max-w-lg mx-auto border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-center text-indigo-600 mb-4">
        🎉 I Cracked the Cryptogram!
      </h2>

      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-500 mb-1">Decrypted Message:</p>
        <blockquote className="p-3 text-lg italic font-semibold text-gray-800 bg-white border rounded-md">
          {gamePuzzle}
        </blockquote>
      </div>

      <div className="flex justify-between mt-4 text-sm text-gray-700">
        <p>🧡 Lives Left: <span className="font-bold">{lives}</span></p>
        <p>💡 Hints Used: <span className="font-bold">{hintsUsed}</span></p>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400">
        decrypt.me – Can you solve it too?
      </div>
    </div>
  );
});

export default Share;