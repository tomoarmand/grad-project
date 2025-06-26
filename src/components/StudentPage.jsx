import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import useUserStore from '../store/userStore';
import { PuffLoader } from "react-spinners";

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
    const { user } = useUserStore();



    const inputRef = useRef();
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [currentExerciseIndex]);

    const API_URL = import.meta.env.VITE_API_URL;

    // Success message function
    const triggerSuccess = () => {
        // Show success message
        setShowCorrect(true);

        // Hide success message
        setTimeout(() => {
            setShowCorrect(false);
        }, 2000);
    };

    // Screen shake and try again message function
    const triggerTryAgain = () => {
        // Start screen shake
        setIsShaking(true);

        // Show try again message
        setShowTryAgain(true);

        // Stop screen shake after animation
        setTimeout(() => {
            setIsShaking(false);
        }, 600);

        // Hide try again message
        setTimeout(() => {
            setShowTryAgain(false);
        }, 2000);
    };

    // Confetti celebration function
    const celebrate = () => {
        // Fire confetti from multiple angles for better effect
        const duration = 1500; // Halved from 3000ms to 1500ms
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Fire from left side
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });

            // Fire from right side
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(exercises[currentExerciseIndex]);

        const correctAnswer = exercises[currentExerciseIndex].correctAnswer;
        const trimmedInput = inputValue.replaceAll(" ", "");
        const trimmedAnswer = correctAnswer.replaceAll(" ", "");

        if (trimmedInput === trimmedAnswer) {
            // Trigger confetti celebration
            celebrate();
            triggerSuccess();

            setInputValue("");

            setShowAnswer(false);

            // Delay refreshing exercise to let celebration play
            setTimeout(() => {
                refreshExercise();
            }, 1000); // Reduced from 2000ms to 1000ms
        } else {
            // Trigger screen shake and try again message
            triggerTryAgain();
            setFailedAttempts(prev => {
                const newAttempts = prev + 1;
                if (newAttempts >= 3) {
                    setShowAnswer(true);
                }

                if (newAttempts > 3) {
                    setFeedback(correctAnswer);
                }
                return newAttempts;
            });
            setInputValue("");
        }

    };

    const getRandomIndex = (length, except = null) => {
        if (length <= 1) return 0;

        let randomIndex = Math.floor(Math.random() * length);

        if (randomIndex == except) {
            randomIndex++;
            if (randomIndex == length) {
                randomIndex = 0;
            }
        }
        console.log("Random Index:", randomIndex);
        return randomIndex;
    };

    const refreshExercise = () => {
        const newIndex = getRandomIndex(exercises.length, currentExerciseIndex);
        setCurrentExerciseIndex(newIndex);
        setShowAnswer(false);
        setFeedback("");
        setFailedAttempts(0);
    };

    let stored = [];

    const fetchExercises = async () => {
        if (!user) return;

        setLoading(true);
        const response = await fetch(`${API_URL}/exercises?studentId=${user._id}`);
        stored = await response.json();
        setExercises(stored);

        const randomIndex = getRandomIndex(stored.length);
        setCurrentExerciseIndex(randomIndex);

        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchExercises();
        }
    }, [user]);

    if (currentExerciseIndex !== null && exercises[currentExerciseIndex]) {
        console.log("Current correct answer:", exercises[currentExerciseIndex].correctAnswer);
    }

    return (
        <div className={`min-h-screen w-screen flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden ${isShaking ? 'animate-shake' : ''}`}>

            <h1 className="text-2xl text-white font-semibold mb-6">Welcome, {user?.fullName || 'Student'}!</h1>
            {loading && (
                <div className="flex flex-col items-center justify-center text-white text-xl">
                    <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
                    <p className="mt-4">Loading exercises...</p>
                </div>
            )}

            {/* Correct Answer Message */}
            {showCorrect && (
                <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                    <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg border-2 border-green-600">
                        <p className="text-2xl font-bold text-center">🎉 Correct!</p>
                        <p className="text-sm text-center mt-1 opacity-90">Excellent work!</p>
                    </div>
                </div>
            )}

            {/* Try Again Message */}
            {showTryAgain && (
                <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                    <div className="bg-red-500 text-white px-8 py-4 rounded-lg shadow-lg border-2 border-red-600">
                        <p className="text-2xl font-bold text-center">❌ Try Again!</p>
                        <p className="text-sm text-center mt-1 opacity-90">Keep going, you've got this!</p>
                    </div>
                </div>
            )}

            {currentExerciseIndex !== null && exercises[currentExerciseIndex] &&
                (<>
                    <form
                        className="flex flex-col items-center"
                        onSubmit={handleSubmit}>
                        <p className="text-white text-s mb-4 ms-4 text-center">Listen to the recording and type your answer below (e.g., "Perfect Fifth")</p>
                        <audio controls src={exercises[currentExerciseIndex].audioData}></audio>
                        <div>
                            <input
                                className="text-base sm:text-l md:text-xl pl-3 rounded-sm text-black bg-[#f8fafc] mt-20 h-11"
                                onChange={handleInputChange}
                                value={inputValue}
                                placeholder="Enter your answer here..."
                                ref={inputRef}
                            />
                            <button
                                disabled={!inputValue.trim()}
                                className={`text-lg sm:text-xl md:text-2xl border-none rounded px-4 py-2 ml-4 text-center inline-block text-[#f8fafc] 
    ${inputValue.trim() ? 'bg-[#64748b] hover:bg-[#fb923c]' : 'bg-gray-400 cursor-not-allowed'}`}>
                                Submit
                            </button>
                        </div>
                    </form>
                    {showAnswer && (
                        <div className="mt-4 flex flex-col items-center">
                            {!feedback && (
                                <button
                                    onClick={() => setFeedback(exercises[currentExerciseIndex].correctAnswer)}
                                    className="text-sm sm:text-base md:text-lg text-[#f8fafc] bg-[#f87171] hover:bg-[#ef4444] px-4 py-2 rounded shadow"
                                >
                                    Show Answer
                                </button>
                            )}
                            {feedback && (
                                <p className="mt-2 text-white text-lg transition-opacity duration-500 ease-in opacity-100">
                                    Answer: {feedback}
                                </p>
                            )}
                        </div>
                    )}
                </>)
            }
            <Link to="/"><p className="font-bold text-base sm:text-l md:text-xl mb-1 sm:mb-2 mt-20 text-[#f8fafc]">Home Page</p></Link>

            {/* CSS for shake animation */}
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