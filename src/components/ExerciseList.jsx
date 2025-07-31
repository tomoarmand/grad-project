import { PuffLoader } from "react-spinners";
import { useState, useRef } from 'react';
import MusicSymbolButton from './MusicSymbolButton';

function ExerciseList({ exercises, onDelete, onRename, loading }) {
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150);
  };

  const handleSave = async () => {
    if (newName.trim() !== '') {
      await onRename(renamingId, newName.trim());
      setRenamingId(null);
      setNewName('');
      setIsInputFocused(false);
    }
  };

  const handleCancel = () => {
    setRenamingId(null);
    setNewName('');
    setIsInputFocused(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  const sortedExercises = [...exercises].sort((a, b) =>
    a.correctAnswer.localeCompare(b.correctAnswer, undefined, { sensitivity: 'base' })
  );

  return (
    <ul className="w-full">
      {sortedExercises.map((ex) => (
        <li
          key={ex._id}
          className="bg-slate-600 p-4 rounded-lg mb-4 flex flex-col gap-4"
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
                  className="flex-grow bg-white text-black border border-slate-300 p-3 rounded-lg w-full text-base focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
                  autoFocus
                  placeholder="Enter new name"
                />
                {isInputFocused && (
                  <MusicSymbolButton
                    inputRef={inputRef}
                    setterFunction={setNewName}
                  />
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  onClick={handleSave}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  onClick={handleCancel}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <p className="text-white text-base font-medium flex-grow">
                  {ex.correctAnswer}
                </p>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setRenamingId(ex._id);
                      setNewName(ex.correctAnswer);
                    }}
                    aria-label="Rename exercise"
                    className="text-orange-400 hover:text-orange-500 focus:outline-none p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536M16.768 4.768a2.5 2.5 0 113.536
                        3.536L7 21H3v-4L16.768 4.768z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => onDelete(ex._id)}
                    aria-label="Delete exercise"
                    className="text-red-500 hover:text-red-600 focus:outline-none p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
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

              <audio 
                controls 
                src={ex.audioData} 
                className="w-full rounded-lg"
                style={{height: '40px'}}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default ExerciseList;