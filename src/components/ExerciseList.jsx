import { PuffLoader } from "react-spinners";

function ExerciseList({ exercises, onDelete, loading }) {
    return (
      <div className="w-full">
        <h2 className="font-bold text-3xl sm:text-4xl text-center mb-6 text-[#f8fafc]">
          Saved Exercises
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-6">
            <PuffLoader color="#f8fafc" size={40} />
            <p className="text-lg sm:text-xl text-[#f8fafc] mt-4">Loading...</p>
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-lg sm:text-xl text-center text-[#f8fafc]">No exercises saved yet...</p>
        ) : (
          <ul className="flex flex-col gap-6 mt-2">
            {exercises.map((ex) => (
              <li key={ex._id} className="flex flex-col gap-3">
                <p className="font-bold text-base sm:text-lg text-[#f8fafc]">Answer: {ex.correctAnswer}</p>
                <div className="flex items-center gap-3">
                  <audio controls src={ex.audioData} type="audio/mp4" className="w-full" />
                  <button
                    className="bg-[#64748b] hover:bg-[#fb923c] text-white font-semibold rounded-full px-4 py-2 text-sm sm:text-base transition duration-200"
                    onClick={() => onDelete(ex._id)}
                  >
                    X
                  </button>
                  <button
                    className="bg-[#64748b] hover:bg-[#fb923c] text-white font-semibold rounded-full px-4 py-2 text-sm sm:text-base transition duration-200"
                  >
                    E
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

export default ExerciseList;