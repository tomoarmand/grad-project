import { PuffLoader } from "react-spinners";
import { useState, useRef } from 'react';
// import useFABStore from '../store/fabStore'; // REMOVE THIS IMPORT
import MusicSymbolButton from './MusicSymbolButton';

function ExerciseList({ exercises, onDelete, onRename, loading }) {
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false); // Local state for input focus

  // REMOVED useFABStore destructuring

  // The symbol insertion logic moves into MusicSymbolButton itself
  // so this component just needs to manage its own focus state.
  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = (e) => {
    // Check if focus is truly leaving the input AND the MusicSymbolButton
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150); // Small delay to allow MusicSymbolButton's click to register
  };

  const handleSave = async () => {
    if (newName.trim() !== '') {
      await onRename(renamingId, newName.trim());
      setRenamingId(null);
      setNewName('');
      setIsInputFocused(false); // Reset focus state on save
    }
  };

  const handleCancel = () => {
    setRenamingId(null);
    setNewName('');
    setIsInputFocused(false); // Reset focus state on cancel
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  return (
    <ul className="w-full">
      {exercises.map((ex) => (
        <li
          key={ex._id}
          className="bg-slate-600 p-4 rounded mb-4 flex flex-col gap-4"
        >
          {renamingId === ex._id ? (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-row gap-2 w-full items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="flex-grow bg-white text-black border border-slate-300 p-3 rounded w-full text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                  placeholder="Enter new name"
                />
                {/* Pass inputRef and the setterFunction directly to MusicSymbolButton */}
                {isInputFocused && <MusicSymbolButton inputRef={inputRef} setterFunction={setNewName} />}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                  onClick={handleSave}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
                  onClick={handleCancel}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-white text-lg font-medium">
                  Correct Answer: {ex.correctAnswer}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setRenamingId(ex._id);
                      setNewName(ex.correctAnswer);
                    }}
                    aria-label="Rename exercise"
                    className="text-orange-400 hover:text-orange-500 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536M16.768 4.768a2.5 2.5 0 113.536
                        3.536L7 21H3v-4L16.768 4.768z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => onDelete(ex._id)}
                    aria-label="Delete exercise"
                    className="text-red-500 hover:text-red-600 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2
                        0 01-1.995-1.858L5 7m5-4h4m-4
                        0a1 1 0 00-1 1v1h6V4a1 1
                        0 00-1-1m-4 0h4" />
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