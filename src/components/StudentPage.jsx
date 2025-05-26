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
        const newIndex = Math.floor(Math.random() * exercises.length);
        setCurrentExerciseIndex(newIndex);
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        const correctAnswer = exercises[currentExerciseIndex].correctAnswer

        if (inputValue == correctAnswer) {
            alert("Correct Answer");
            setInputValue("")
            refreshExercise();
        } else {
            alert("Try Again")
            setInputValue("");
        }



    }
    let randomIndexStorage = [];

    const trueRandomIndex = () => {

        let maxTries = stored.length
        let tries = 0
        let randomIndex

        do {
            randomIndex = Math.floor(Math.random() * stored.length);
            tries++
        } while (randomIndexStorage.includes(randomIndex) && (tries < maxTries))

        if (!randomIndexStorage.includes(randomIndex)) {
            randomIndexStorage.push(randomIndex);
            return randomIndex;

        } else {
            return null;
        }
    }

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("exercises") || "[]");
        setExercises(stored);

        const randomIndex = Math.floor(Math.random() * stored.length);
        console.log("Random Index:", randomIndex);

        setCurrentExerciseIndex(randomIndex)
    }, []);

    console.log(exercises[currentExerciseIndex])

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