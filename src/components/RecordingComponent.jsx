import { useState, useRef } from "react";

function RecordingComponent({ onSave }) {
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
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result;
                const newExercise = {
                id: Date.now(),
                audioData: base64Audio,
                correctAnswer,
            };

            onSave(newExercise);
            setCorrectAnswer("")
            };

            reader.readAsDataURL(blob);
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