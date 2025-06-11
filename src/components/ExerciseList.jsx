function ExerciseList({ exercises, onDelete, loading }) {
    return (
        <div className="flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden">
            <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl mb-5 sm:mb-8 text-[#f8fafc]">Saved Exercises</h2>

            {loading ? (
                <p className="text-lg sm:text-xl md:text-2xl text-[#f8fafc]">Loading...</p>
            ) : exercises.length === 0 ? (
                <p className="text-lg sm:text-xl md:text-2xl text-[#f8fafc]">No exercises saved yet...</p>
            ) : (
                <ul>
                    {exercises.map((ex) => (
                        <li key={ex._id}>
                            <p className="font-bold text-base sm:text-l md:text-xl mb-1 sm:mb-2 text-[#f8fafc]">Answer: {ex.correctAnswer}</p>
                            <div className="flex justify-center items-center mb-3 sm:mb-5">
                                <audio controls src={ex.audioData} type="audio/mp4"></audio>
                                <button
                                    className="text-lg sm:text-xl md:text-2xl border-none rounded-full px-4 py-2 text-center inline-block text-[#f8fafc] bg-[#64748b] hover:bg-[#fb923c] ml-3"
                                    onClick={() => onDelete(ex._id)}
                                >
                                    X
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ExerciseList