// components/Lives.jsx
export default function Lives({ lives }) {
  return (
    <div className="flex justify-center items-center gap-2">
      <span className="text-xl border-2 border-red-300 rounded-2xl p-1">
        {"❤️".repeat(Math.max(0, lives))}
      </span>
    </div>
  );
}