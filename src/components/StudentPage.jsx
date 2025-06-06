import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

function StudentPage() {
    const [exercises, setExercises] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
    const [feedback, setFeedback] = useState("")

    const API_URL = import.meta.env.VITE_API_URL;

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(exercises[currentExerciseIndex]);

        const correctAnswer = exercises[currentExerciseIndex].correctAnswer


        if (inputValue === correctAnswer) {
            alert("Correct Answer");
            setInputValue("")
            refreshExercise();
        } else {
            alert("Try Again")
            setInputValue("");
        }

    }

    const getRandomIndex = (length, except = null) => {
        if (length <= 1) return 0;

        let randomIndex = Math.floor(Math.random() * length);

        if (randomIndex == except) {
            randomIndex++
            if (randomIndex == length) {
                randomIndex = 0
            }
        }
        console.log("Random Index:", randomIndex);
        return randomIndex;
    }

    const refreshExercise = () => {
        const newIndex = getRandomIndex(exercises.length, currentExerciseIndex);
        setCurrentExerciseIndex(newIndex);
    }

    let stored = [];

    const fetchExercises = async () => {
        const response = await fetch(`${API_URL}/exercises`);
        stored = await response.json();
        setExercises(stored);

        const randomIndex = getRandomIndex(stored.length);
        setCurrentExerciseIndex(randomIndex);
    }

    useEffect(() => {
        fetchExercises();
    }, []);

    if (currentExerciseIndex !== null && exercises[currentExerciseIndex]) {
        console.log("Current correct answer:", exercises[currentExerciseIndex].correctAnswer);
    }

    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden">
            {currentExerciseIndex !== null && exercises[currentExerciseIndex] &&
                (<form 
                className="flex flex-col items-center"
                onSubmit={handleSubmit}>
                    <audio controls src={exercises[currentExerciseIndex].audioData}></audio>
                    <div>
                    <input
                        className="text-m text-center sm:text-l md:text-xl  text-bl bg-[#f8fafc] mt-20 h-10"
                        onChange={handleInputChange}
                        value={inputValue}
                        placeholder="Enter your answer here"
                    />
                    <button
                    className="text-lg sm:text-xl md:text-2xl border-none rounded px-4 py-2 ml-4 text-center inline-block text-[#f8fafc] bg-[#64748b] hover:bg-[#fb923c]" type="submit">Submit</button>
                    </div>
                </form>)}
            <Link to="/"><p className="font-bold text-m sm:text-l md:text-xl mb-1 sm:mb-2 mt-20 text-[#f8fafc]">Home Page</p></Link>
        </div>
    )
}

export default StudentPage