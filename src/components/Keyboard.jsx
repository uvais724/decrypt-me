export default function Keyboard({ onKey }) {
  const keys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className="border px-4 py-2 rounded"
        >
          {k}
        </button>
      ))}
    </div>
  );
}
