function Buttons({ onClick }) {
    return (
      <div className="flex gap-2 justify-center mt-2">
        <button
          type="button"
          onClick={() => onClick('♭')}
          className="bg-slate-500 hover:bg-orange-400 text-white px-3 py-1 rounded-lg text-lg shadow"
        >
          ♭
        </button>
        <button
          type="button"
          onClick={() => onClick('♯')}
          className="bg-slate-500 hover:bg-orange-400 text-white px-3 py-1 rounded-lg text-lg shadow"
        >
          ♯
        </button>
      </div>
    );
  }
  
  export default Buttons;