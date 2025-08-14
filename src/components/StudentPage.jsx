import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import ConfirmDialog from './ConfirmDialog';
import useUserStore from '../store/userStore';
import { PuffLoader } from "react-spinners";
import MusicSymbolButton from './MusicSymbolButton';

function StudentPage() {
  const [exercises, setExercises] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const inputRef = useRef();
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
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

  const getEncouragementMessage = (attempts) => {
    switch (attempts) {
      case 1:
        return { title: "Almost there!", subtitle: "Give it another try!" };
      case 2:
        return { title: "You're getting closer!", subtitle: "One more time!" };
      case 3:
      default:
        return { title: "Don't worry, this is challenging.", subtitle: "Here's some help..." };
    }
  };

  const triggerTryAgain = (attempts) => {
    setIsShaking(true);
    setShowTryAgain(true);
    setTimeout(() => setIsShaking(false), 600);
    setTimeout(() => setShowTryAgain(false), 2000);
  };

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

  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150);
  };

  const handleSubmit = () => {
    const correctAnswer = exercises[currentExerciseIndex].correctAnswer.toLowerCase();
    const trimmedInput = inputValue.replaceAll(" ", "").toLowerCase();
    const trimmedAnswer = correctAnswer.replaceAll(" ", "");

    if (trimmedInput === trimmedAnswer) {
      celebrate();
      triggerSuccess();
      setInputValue("");
      setShowAnswer(false);
      setFeedback("");
      setIsInputFocused(false);
      setTimeout(refreshExercise, 1000);
    } else {
      setFailedAttempts((prev) => {
        const newAttempts = prev + 1;
        triggerTryAgain(newAttempts);
        if (newAttempts >= 3) setShowAnswer(true);
        return newAttempts;
      });
    }
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
  };

  const fetchExercises = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/exercises?studentId=${user._id}`);
      const data = await res.json();
      setExercises(data);
      if (data.length > 0) {
        const randomIndex = getRandomIndex(data.length);
        setCurrentExerciseIndex(randomIndex);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchExercises();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 text-white px-4">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 ${isShaking ? 'animate-shake' : ''}`}>
      <div className="w-full max-w-md bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 flex flex-col items-center gap-6">
        <h1 className="text-3xl sm:text-4xl text-white font-bold mb-4 text-center">
          Welcome, {user?.fullName?.split(' ')[0] || 'Student'}!
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-white text-xl">
            <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
            <p className="mt-4">Loading exercises...</p>
          </div>
        ) : (
          <>
            {showCorrect && (
              <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg border-2 border-green-600">
                  <p className="text-2xl font-bold text-center">Correct!</p>
                  <p className="text-sm text-center mt-1 opacity-90">Excellent work!</p>
                </div>
              </div>
            )}

            {showTryAgain && (
              <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                <div className="bg-red-500 text-white px-8 py-4 rounded-lg shadow-lg border-2 border-red-600">
                  <p className="text-2xl font-bold text-center">{getEncouragementMessage(failedAttempts).title}</p>
                  <p className="text-sm text-center mt-1 opacity-90">{getEncouragementMessage(failedAttempts).subtitle}</p>
                </div>
              </div>
            )}

            {currentExerciseIndex !== null && exercises[currentExerciseIndex] && (
              <>
                <div className="flex flex-col items-center w-full">
                  <p className="text-white text-center text-sm sm:text-base mb-4">
                    Listen to the recording and type your answer below
                  </p>
                  <audio controls src={exercises[currentExerciseIndex].audioData} className="w-full mb-6 rounded" />

                  <div className="flex flex-row gap-2 w-full items-center">
                    <div className="relative flex-grow">
                      <input
                        ref={inputRef}
                        className="w-full text-base sm:text-lg rounded bg-[#f8fafc] text-black px-4 h-12 placeholder-gray-500 border border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
                        placeholder="Enter your answer here..."
                        onChange={handleInputChange}
                        value={inputValue}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && inputValue.trim()) handleSubmit();
                        }}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </div>
                    <div data-fab>
                      <MusicSymbolButton inputRef={inputRef} setterFunction={setInputValue} />
                    </div>
                  </div>

                  <button
                    disabled={!inputValue.trim()}
                    onClick={handleSubmit}
                    className={`px-6 text-lg sm:text-xl rounded mt-5 h-12 w-30 font-semibold text-white transition duration-200 ${
                      inputValue.trim() 
                        ? "bg-[#64748b] hover:bg-[#fb923c]" 
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Submit
                  </button>
                </div>

                {showAnswer && (
                  <div className="mt-4 flex flex-col items-center">
                    {!feedback ? (
                      <button
                        onClick={() => setFeedback(exercises[currentExerciseIndex].correctAnswer)}
                        className="text-sm sm:text-base md:text-lg text-[#f8fafc] bg-[#f87171] hover:bg-[#ef4444] px-4 py-2 rounded shadow"
                      >
                        Show Answer
                      </button>
                    ) : (
                      <p className="mt-2 text-white text-lg transition-opacity duration-500 ease-in opacity-100">
                        Answer: {feedback}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Sign Out Link - positioned below the card */}
      <div className="text-center mt-4">
        <button
          onClick={confirmSignOut}
          className="text-sm text-white/70 hover:text-white underline transition-colors"
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default StudentPage;