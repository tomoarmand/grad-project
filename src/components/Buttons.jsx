function Buttons({ onClick }) {
  return (
    <div className="flex gap-2 justify-center mt-2">
      <button
        type="button"
        onClick={() => onClick('♭')}
        className="bg-neutral-800 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-lg shadow border border-white/10 transition"
      >
        ♭
      </button>
      <button
        type="button"
        onClick={() => onClick('♯')}
        className="bg-neutral-800 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-lg shadow border border-white/10 transition"
      >
        ♯
      </button>
    </div>
  );
}

export default Buttons;