Let me know if you'd like to refactor this with lifted state to share updates between components (e.g. when a new recording is added), or if you're ready to set up a backend for saving exercises persistently.



You said:
import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';

function TeacherPage() {
    return (
        <>
        <h1>Teacher Page</h1>
        <ExerciseList />
        <RecordingComponent />
        <Link to="/">Home Page</Link>
        </>
    )
}

export default TeacherPage

import { useState, useEffect } from "react";

function ExerciseList() {
    const [exercises, setExercises] = useState([]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("exercises") || "[]");
        setExercises(stored);
    }, []);

    const deleteExercise = (id) => {
        const updatedExercises = exercises.filter((ex) => ex.id !==id);
        localStorage.setItem("exercises", JSON.stringify(updatedExercises));
        setExercises(updatedExercises);
    }

    return (
        <>
        <h2>Saved Exercises</h2>
        {exercises.length === 0 && <p>No exercises saved yet...</p>}
        <ul>
            {exercises.map((ex) => (
                <li key={ex.id}>
                <p>Answer: {ex.correctAnswer}</p>
                <audio controls src={ex.audioURL}></audio>
                <button onClick={() => deleteExercise(ex.id)}>Delete</button>
                </li>
            ))
            }
        </ul>
        </>
    )
}

export default ExerciseList

import { useState, useRef } from "react";

function RecordingComponent() {
    const [isRecording, setIsRecording] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio : true });
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunks.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunks.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunks.current, { type: "audio/webm" });
            const audioURL = URL.createObjectURL(blob);

            const existing = JSON.parse(localStorage.getItem("exercises") || "[]");
            const newExercise = {
                id: Date.now(),
                audioURL,
                correctAnswer,
            };
            localStorage.setItem("exercises", JSON.stringify([...existing, newExercise]));
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    return (
        <>
        <h2>Record Exercise</h2>
        <input
        type="text"
        placeholder="Correct Answer"
        value={correctAnswer}
        onChange={(event) => setCorrectAnswer(event.target.value)}
        />
        {!isRecording ? (
            <button onClick={startRecording}>Start Recording</button>
        ) : (
            <button onClick={stopRecording}>Stop & Save</button>
        )}
        </>
    )
}

export default RecordingComponent

The exercises are appearing in the list only after the page is refreshed, also the playback function is not working.  How can I resolve this?

ChatGPT said:
You're encountering two separate (but common) issues:

✅ 1. Exercises only appear after refresh
This happens because your ExerciseList component only reads from localStorage once, when it first mounts (via useEffect), and it doesn't know when new recordings are added.

✅ Solution: Lift state up to TeacherPage so both RecordingComponent and ExerciseList share and update the same exercises list.
✅ 2. Audio playback not working
This usually happens when you're saving audioURL as an Object URL (via URL.createObjectURL(blob)), but those URLs are only valid during the current page session. When the page is refreshed, the object URLs are gone — they're not persistent.

✅ Solution: Save audio data in a persistable format like a Base64 string (or eventually, send it to a server).

