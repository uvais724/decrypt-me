// components/Lives.jsx
export default function Lives({ lives }) {
  return (
    <div className="flex justify-center items-center gap-2">
      <span className="md:text-xl border-2 border-red-300 rounded-2xl p-1 max-sm:w-20 w-28 flex items-center justify-center flex-none">
        {"❤️".repeat(Math.max(0, lives))}
      </span>
    </div>
  );
}
