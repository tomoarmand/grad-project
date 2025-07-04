import { useState } from 'react';

function ExerciseList({ exercises, onDelete, onRename, loading }) {
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <ul className="w-full">
      {exercises.map((ex) => (
        <li
          key={ex._id}
          className="bg-slate-600 p-4 rounded mb-2 flex flex-col gap-3"
        >
          {/* Replace the text with input if renaming */}
          {renamingId === ex._id ? (
            <div className="flex flex-col gap-2 w-full">
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
            <>
              <p className="text-white text-lg font-medium">Correct Answer: {ex.correctAnswer}</p>
              <audio controls src={ex.audioData}></audio>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setRenamingId(ex._id);
                    setNewName(ex.correctAnswer);
                  }}
                  className="text-blue-400 font-semibold"
                >
                  Rename
                </button>
                <button
                  onClick={() => onDelete(ex._id)}
                  className="text-red-500 font-semibold"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default ExerciseList;