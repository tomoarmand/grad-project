import { PuffLoader } from "react-spinners";
import { useState } from 'react';

function ExerciseList({ exercises, onDelete, onRename, loading }) {
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');

  if (loading) 
    return (
      <div className="flex justify-center items-center py-10">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );

  return (
    <ul className="w-full">
      {exercises.map((ex) => (
        <li
          key={ex._id}
          className="bg-slate-600 p-4 rounded mb-4 flex flex-col gap-4"
        >
          {renamingId === ex._id ? (
            <div className="flex flex-col gap-3 w-full">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-black p-3 rounded w-full text-lg"
                autoFocus
                placeholder="Enter new name"
              />
              <div className="flex gap-3 justify-end">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={async () => {
                    if (newName.trim() !== '') {
                      await onRename(ex._id, newName.trim());
                      setRenamingId(null);
                      setNewName('');
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setRenamingId(null);
                    setNewName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-white text-lg font-medium">Correct Answer: {ex.correctAnswer}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setRenamingId(ex._id);
                      setNewName(ex.correctAnswer);
                    }}
                    aria-label="Rename exercise"
                    className="text-orange-400 hover:text-orange-500 focus:outline-none"
                  >
                    {/* Pencil icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M16.768 4.768a2.5 2.5 0 113.536 3.536L7 21H3v-4L16.768 4.768z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => onDelete(ex._id)}
                    aria-label="Delete exercise"
                    className="text-red-500 hover:text-red-600 focus:outline-none"
                  >
                    {/* Trash can icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4" />
                    </svg>
                  </button>
                </div>
              </div>

              <audio controls src={ex.audioData}></audio>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default ExerciseList;