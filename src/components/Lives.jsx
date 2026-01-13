// components/Lives.jsx
export default function Lives({ lives, maxLives = 3 }) {
  const hearts = Array.from({ length: maxLives });

  return (
    <div className="flex justify-center items-center gap-2">
      <span className="md:text-xl border-2 border-red-300 rounded-2xl p-2 max-sm:w-20 w-28 flex items-center justify-center flex-none">
        <div className="flex items-center justify-center gap-2">
          {hearts.map((_, i) => {
            const filled = i < Math.max(0, lives);
            return filled ? (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 max-sm:h-3 max-sm:w-3  text-red-500">
                <path fill="currentColor" d="M12 21s-7.5-4.735-10-8.01A6.5 6.5 0 0112 3.5a6.5 6.5 0 0110 9.49C19.5 16.265 12 21 12 21z" />
              </svg>
            ) : (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 max-sm:h-3 max-sm:w-3 text-gray-300">
                <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12 21s-7.5-4.735-10-8.01A6.5 6.5 0 0112 3.5a6.5 6.5 0 0110 9.49C19.5 16.265 12 21 12 21z" />
              </svg>
            );
          })}
        </div>
      </span>
    </div>
  );
}
