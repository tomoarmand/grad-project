import { PuffLoader } from "react-spinners";
import { useState, useRef } from 'react';
import MusicSymbolButton from './MusicSymbolButton';
import ConfirmDialog from './ConfirmDialog';

function ExerciseList({ exercises, onDelete, onRename, loading }) {
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Input validation functions
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  const validateExerciseName = (name) => {
    const sanitized = sanitizeInput(name);
    if (!sanitized || sanitized.length < 1) {
      return { isValid: false, message: 'Exercise name is required' };
    }
    if (sanitized.length > 200) {
      return { isValid: false, message: 'Exercise name must be 200 characters or less' };
    }
    // Allow letters, numbers, spaces, and common musical notation characters
    const validNameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_.,!()&♪♫♬♩♭♮♯°]+$/;
    if (!validNameRegex.test(sanitized)) {
      return { isValid: false, message: 'Exercise name contains invalid characters' };
    }
    return { isValid: true, sanitized };
  };

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

  const handleNewNameChange = (value) => {
    if (value.length <= 200) { // Enforce max length
      setNewName(value);
      // Clear error when user starts typing
      if (error) {
        setError('');
      }
    }
  };

  const handleSave = async () => {
    const validation = validateExerciseName(newName);
    
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    try {
      await onRename(renamingId, validation.sanitized);
      setRenamingId(null);
      setNewName('');
      setIsInputFocused(false);
      setError('');
    } catch (err) {
      setError('Failed to rename exercise. Please try again.');
      console.error('Error renaming exercise:', err);
    }
  };

  const handleCancel = () => {
    setRenamingId(null);
    setNewName('');
    setIsInputFocused(false);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const confirmDeleteExercise = (exerciseId) => {
    setExerciseToDelete(exerciseId);
    setShowDeleteDialog(true);
  };

  const handleDeleteExercise = async () => {
    try {
      await onDelete(exerciseToDelete);
    } catch (err) {
      console.error('Error deleting exercise:', err);
      alert('Failed to delete exercise. Please try again.');
    }
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

  const exerciseName = exerciseToDelete 
    ? exercises.find(ex => ex._id === exerciseToDelete)?.correctAnswer || 'this exercise'
    : 'this exercise';

  return (
    <>
      <ul className="w-full">
        {sortedExercises.map((ex) => (
          <li
            key={ex._id}
            className="bg-slate-600 p-4 rounded-lg mb-4 flex flex-col gap-4"
          >
            {renamingId === ex._id ? (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-row gap-2 w-full items-center">
                  <div className="flex-grow">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => handleNewNameChange(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      className={`w-full bg-white text-black border p-3 rounded-lg text-base transition ${
                        error 
                          ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]' 
                          : 'border-slate-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
                      }`}
                      autoFocus
                      placeholder="Enter new name"
                      maxLength="200"
                    />
                    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
                  </div>
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
                    disabled={!newName.trim()}
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
                    {sanitizeInput(ex.correctAnswer)}
                  </p>
                  <div className="flex gap-3 flex-shrink-0">
                    <button
                      onClick={() => {
                        setRenamingId(ex._id);
                        setNewName(ex.correctAnswer);
                        setError('');
                      }}
                      aria-label="Rename exercise"
                      className="text-orange-400 hover:text-orange-500 focus:outline-none p-1 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536M16.768 4.768a2.5 2.5 0 113.536
                          3.536L7 21H3v-4L16.768 4.768z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => confirmDeleteExercise(ex._id)}
                      aria-label="Delete exercise"
                      className="text-red-500 hover:text-red-600 focus:outline-none p-1 transition"
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setExerciseToDelete(null);
        }}
        onConfirm={handleDeleteExercise}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${sanitizeInput(exerciseName)}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}

export default ExerciseList;