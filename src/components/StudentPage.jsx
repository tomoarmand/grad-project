import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import ConfirmDialog from './ConfirmDialog';
import useUserStore from '../store/userStore';
import { PuffLoader } from "react-spinners";
import MusicSymbolButton from './MusicSymbolButton';

// Helper function to track events
function trackAnalyticsEvent(category, action, label = '') {
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
}

function StudentPage() {
  const [exercises, setExercises] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  
  // New state for folder selection
  const [assignedFolders, setAssignedFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderSelection, setShowFolderSelection] = useState(false);
  
  const inputRef = useRef();
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    trackAnalyticsEvent('Student', 'Sign_Out', user?.fullName);
    logout();
    navigate('/');
  };

  const confirmSignOut = () => {
    setShowSignOutDialog(true);
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentExerciseIndex]);

  const triggerSuccess = () => {
    setShowCorrect(true);
    setTimeout(() => setShowCorrect(false), 2000);
  };

  // PROGRESSIVE ENCOURAGEMENT: Provides contextual feedback based on attempt count
  // WHY: Motivates students differently based on their persistence level
  // NOTE: Messages escalate from gentle encouragement to hints after 3 attempts
  const getEncouragementMessage = (attempts) => {
    switch (attempts) {
      case 1:
        return "Not quite right - Try again!";
      case 2:
        return "Keep trying! Take another listen";
      case 3:
      default:
        return "This one's tricky - Need some help?";
    }
  };

  const triggerInputError = (attempts) => {
    setIsInputShaking(true);
    setShowInputError(true);
    
    // Haptic feedback on mobile if supported
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
    
    setTimeout(() => setIsInputShaking(false), 600);
    setTimeout(() => setShowInputError(false), 3000);
  };

  // CELEBRATION: Multi-burst confetti animation for correct answers
  // WHY: Provides immediate positive reinforcement to maintain student engagement
  // NOTE: Uses canvas-confetti library with calculated particle reduction over time
  const celebrate = () => {
    const duration = 1500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleInputFocus = () => setIsInputFocused(true);

  // FAB INTERACTION: Prevent input blur when clicking floating action button
  // WHY: Maintains input focus for better UX during exercise completion
  // NOTE: Uses setTimeout to handle React's event timing and prevent focus loss
  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150);
  };

  // EXERCISE VALIDATION: Check student answer against correct solution
  // WHY: Core learning logic with immediate feedback and attempt tracking
  // NOTE: Uses normalized comparison to handle spacing variations and case insensitivity
  const handleSubmit = () => {
    const correctAnswer = exercises[currentExerciseIndex].correctAnswer.toLowerCase();
    const trimmedInput = inputValue.replaceAll(" ", "").toLowerCase();
    const trimmedAnswer = correctAnswer.replaceAll(" ", "");

    if (trimmedInput === trimmedAnswer) {
      trackAnalyticsEvent('Student', 'Correct_Answer', `Exercise_${currentExerciseIndex}`);
      celebrate();
      triggerSuccess();
      setInputValue("");
      setShowAnswer(false);
      setFeedback("");
      setIsInputFocused(false);
      setShowInputError(false);
      setTimeout(refreshExercise, 1000);
    } else {
      setFailedAttempts((prev) => {
        const newAttempts = prev + 1;
        trackAnalyticsEvent('Student', 'Wrong_Answer', `Attempt_${newAttempts}`);
        triggerInputError(newAttempts);
        if (newAttempts >= 3) setShowAnswer(true);
        return newAttempts;
      });
    }
  };

  const handleShowAnswer = () => {
    trackAnalyticsEvent('Student', 'Show_Answer_Used', `Exercise_${currentExerciseIndex}_Attempts_${failedAttempts}`);
    setFeedback(exercises[currentExerciseIndex].correctAnswer);
  };

  const getRandomIndex = (length, except = null) => {
    if (length <= 1) return 0;
    let randomIndex = Math.floor(Math.random() * length);
    if (randomIndex === except) randomIndex = (randomIndex + 1) % length;
    return randomIndex;
  };

  const refreshExercise = () => {
    const newIndex = getRandomIndex(exercises.length, currentExerciseIndex);
    setCurrentExerciseIndex(newIndex);
    setShowAnswer(false);
    setFeedback("");
    setFailedAttempts(0);
    trackAnalyticsEvent('Student', 'New_Exercise_Started', `Exercise_${newIndex}`);
  };

  // Fetch assigned folders for the student
  const fetchAssignedFolders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/folder-assignments/student/${user._id}/folders`);
      const folders = await res.json();
      setAssignedFolders(folders);
      
      if (folders.length === 1) {
        // If only one folder, auto-select it
        setSelectedFolder(folders[0]);
        fetchExercisesFromFolder(folders[0]._id);
      } else if (folders.length > 1) {
        // If multiple folders, show selection
        setShowFolderSelection(true);
      }
    } catch (error) {
      console.error('Error fetching assigned folders:', error);
      trackAnalyticsEvent('Student', 'Folder_Load_Error', error.message);
    }
  };

  // Fetch exercises from a specific folder
  const fetchExercisesFromFolder = async (folderId) => {
    if (!folderId) return;
    setLoading(true);
    // Reset all exercise-related states
    setFeedback("");
    setShowAnswer(false);
    setFailedAttempts(0);
    setShowCorrect(false);
    setShowInputError(false);
    setInputValue("");
    try {
      const res = await fetch(`${API_URL}/exercises/folder/${folderId}`);
      const data = await res.json();
      setExercises(data);
      if (data.length > 0) {
        const randomIndex = getRandomIndex(data.length);
        setCurrentExerciseIndex(randomIndex);
        trackAnalyticsEvent('Student', 'Exercises_Loaded', `Count_${data.length}`);
      } else {
        trackAnalyticsEvent('Student', 'No_Exercises_Available');
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      trackAnalyticsEvent('Student', 'Exercise_Load_Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the useEffect to call fetchAssignedFolders instead
  useEffect(() => {
    if (user) fetchAssignedFolders();
  }, [user]);

  // Add folder selection handler
  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    setShowFolderSelection(false);
    // Reset all exercise-related states
    setFeedback("");
    setShowAnswer(false);
    setFailedAttempts(0);
    setShowCorrect(false);
    setShowInputError(false);
    setInputValue("");
    setCurrentExerciseIndex(null);
    fetchExercisesFromFolder(folder._id);
    trackAnalyticsEvent('Student', 'Folder_Selected', folder.name);
  };

  // Add folder change handler
  const handleChangeFolder = () => {
    setShowFolderSelection(true);
    trackAnalyticsEvent('Student', 'Change_Folder_Requested');
  };

  if (!user) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 text-white px-4">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center gap-3 sm:gap-6 bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 py-4">
      <div className="w-full max-w-md bg-[#334155] rounded-xl shadow-xl p-4 sm:p-6 md:p-8 flex flex-col items-center gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-white font-bold mb-2 sm:mb-4 text-center">
          Welcome, {user?.fullName?.split(' ')[0] || 'Student'}!
        </h1>

        {/* Folder selection screen - ONLY show this when in folder selection mode */}
        {showFolderSelection && (
          <div className="w-full flex flex-col items-center gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl text-white font-semibold text-center">Choose a Folder to Practice</h2>
            <div className="w-full max-h-[300px] sm:max-h-[400px] overflow-y-auto space-y-2 px-1">
              {assignedFolders.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => handleFolderSelect(folder)}
                  className="w-full p-2 sm:p-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition text-left text-sm sm:text-base shadow-md hover:shadow-lg"
                >
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Everything below only shows when NOT in folder selection mode */}
        {!showFolderSelection && (
          <>
            {/* Folder info and change button when a folder is selected */}
            {selectedFolder && (
              <div className="w-full text-center">
                <div className="bg-slate-600 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-white text-xs sm:text-sm">
                    Practicing from: <span className="text-orange-400 font-medium">{selectedFolder.name}</span>
                  </p>
                  {assignedFolders.length > 1 && (
                    <button
                      onClick={handleChangeFolder}
                      className="text-orange-400 hover:text-orange-300 text-xs underline mt-1"
                    >
                      Change folder
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Folder Instructions - Only show if instructions exist */}
            {selectedFolder && selectedFolder.instructions && selectedFolder.instructions.trim() && (
              <div className="w-full bg-blue-600 rounded-lg p-3 sm:p-4">
                <h3 className="text-white text-xs sm:text-sm font-semibold mb-2">Instructions:</h3>
                <p className="text-white text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedFolder.instructions}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center text-white text-base sm:text-lg">
                <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
                <p className="mt-3 sm:mt-4 text-sm sm:text-base">Loading exercises...</p>
              </div>
            ) : exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-white gap-3 sm:gap-4">
                <p className="text-base sm:text-lg font-medium">No exercises yet</p>
                <p className="text-xs sm:text-sm opacity-80">
                  {selectedFolder ? `The folder "${selectedFolder.name}" doesn't have any exercises yet.` : 'No folders have been assigned to you yet.'}
                  <br />
                  Check back soon!
                </p>
                {assignedFolders.length > 1 && (
                  <button
                    onClick={handleChangeFolder}
                    className="text-orange-400 hover:text-orange-300 text-xs sm:text-sm underline mt-2"
                  >
                    Try a different folder
                  </button>
                )}
              </div>
            ) : (
              <>
                {showCorrect && (
                  <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                    <div className="bg-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg border-2 border-green-600">
                      <p className="text-xl sm:text-2xl font-bold text-center">Correct!</p>
                      <p className="text-xs sm:text-sm text-center mt-1 opacity-90">Excellent work!</p>
                    </div>
                  </div>
                )}

                {currentExerciseIndex !== null && exercises[currentExerciseIndex] && (
                  <>
                    <div className="flex flex-col items-center w-full">
                      <p className="text-white text-center text-xs sm:text-sm mb-3 sm:mb-4">
                        Listen to the recording and type your answer below
                      </p>
                      <audio 
                        controls 
                        src={exercises[currentExerciseIndex].audioData} 
                        className="w-full mb-4 sm:mb-6 rounded"
                        onPlay={() => trackAnalyticsEvent('Student', 'Audio_Played', `Exercise_${currentExerciseIndex}`)}
                      />
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex flex-col sm:flex-row gap-2 w-full items-stretch sm:items-center">
                          <div className="relative flex-grow">
                            <input
                              ref={inputRef}
                              className={`w-full text-sm sm:text-base rounded bg-[#f8fafc] text-black px-3 sm:px-4 py-2 sm:py-3 placeholder-gray-500 border-2 sm:border-4 transition-all duration-200 ${
                                showInputError 
                                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:shadow-[0_0_12px_rgba(239,68,68,0.8),inset_0_0_8px_rgba(239,68,68,0.2)]' 
                                  : 'border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
                              } ${isInputShaking ? 'animate-input-shake' : ''}`}
                              placeholder="Type answer here..."
                              onChange={handleInputChange}
                              value={inputValue}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && inputValue.trim()) handleSubmit();
                              }}
                              onFocus={handleInputFocus}
                              onBlur={handleInputBlur}
                            />
                          </div>
                          <div data-fab className="flex justify-center sm:justify-start">
                            <MusicSymbolButton inputRef={inputRef} setterFunction={setInputValue} />
                          </div>
                        </div>
                        
                        {/* Inline error message below input with pulsing glow */}
                        {showInputError && (
                          <div className="flex items-center gap-2 text-red-500 text-xs sm:text-sm font-semibold animate-fade-in px-1">
                            <span className="text-base sm:text-lg">❌</span>
                            <span>{getEncouragementMessage(failedAttempts)}</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        disabled={!inputValue.trim()}
                        onClick={handleSubmit}
                        className={`px-4 sm:px-6 text-sm sm:text-lg rounded mt-4 sm:mt-5 py-2 sm:py-2.5 font-semibold text-white transition duration-200 ${
                          inputValue.trim() 
                            ? "bg-[#64748b] hover:bg-[#fb923c]" 
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Submit
                      </button>
                    </div>

                    {showAnswer && (
                      <div className="mt-3 sm:mt-4 flex flex-col items-center">
                        {!feedback ? (
                          <button
                            onClick={handleShowAnswer}
                            className="text-xs sm:text-sm md:text-base text-[#f8fafc] bg-[#f87171] hover:bg-[#ef4444] px-3 sm:px-4 py-2 rounded shadow transition"
                          >
                            Show Answer
                          </button>
                        ) : (
                          <p className="mt-2 text-white text-sm sm:text-base lg:text-lg transition-opacity duration-500 ease-in opacity-100">
                            Answer: <span className="font-semibold text-orange-300">{feedback}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Sign Out Link - positioned below the card */}
      <div className="text-center mt-2 sm:mt-4">
        <button
          onClick={confirmSignOut}
          className="text-xs sm:text-sm text-white/70 hover:text-white underline transition-colors"
        >
          Sign Out
        </button>
      </div>

      <ConfirmDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />

      <style jsx>{`
        @keyframes input-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-input-shake {
          animation: input-shake 0.5s ease-in-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.8), inset 0 0 8px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 1), inset 0 0 12px rgba(239, 68, 68, 0.3);
          }
        }
      `}</style>
    </div>
  );
}

export default StudentPage;