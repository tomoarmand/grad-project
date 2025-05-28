import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

function StudentPage() {
    const [exercises, setExercises] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
    const [feedback, setFeedback] = useState("")

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const refreshExercise = () => {
        const newIndex = getRandomIndex(exercises.length, currentExerciseIndex);
        setCurrentExerciseIndex(newIndex);
    }

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

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("exercises") || "[]");
        setExercises(stored);

        const randomIndex = getRandomIndex(stored.length);


        setCurrentExerciseIndex(randomIndex);
    }, []);

    if (currentExerciseIndex !== null && exercises[currentExerciseIndex]) {
        console.log("Current correct answer:", exercises[currentExerciseIndex].correctAnswer);
    }

    return (
        <>
            <h1>Student Page</h1>
            <Link to="/">Home Page</Link>
            {currentExerciseIndex !== null && exercises[currentExerciseIndex] &&
                (<form onSubmit={handleSubmit}>
                    <audio controls src={exercises[currentExerciseIndex].audioData}></audio>
                    <input
                        onChange={handleInputChange}
                        value={inputValue}
                        placeholder="Enter correct answer here"
                    />
                    <button type="submit">Submit</button>
                </form>)}
        </>
    )
}

export default StudentPage