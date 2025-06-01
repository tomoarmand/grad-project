import { useState, useRef } from "react";

function RecordingComponent({ onSave }) {
    const [isRecording, setIsRecording] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const mediaRecorderRef = useRef(null);
    // Stores the MediaRecorder object so it persists across renders
    const audioChunks = useRef([]);
    // An array that holds pieces of the audio as they are recorded

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio : true });
        // Asks the browser for permission to use microphone
        // Stream is an audio stream from the mic

        const mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                alert("⚠️ Audio format not supported on this device.");
                return;
            };

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
        // Creates a new MediaRecorder object to handle recording
        audioChunks.current = [];
        // Clears any previous chunks

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunks.current.push(event.data);
            // Every time a chunk of audio data becomes available, it gets pushed into audioChunks
            console.log(event.data)
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunks.current, { type: mimeType });
            // Combines all the audio chunks into a single Blob, a binary object representing the audio file
            if (blob.size === 0) {
                alert("❌ Recording failed or was too short. Please try again.");
                return;
            };
            const reader = new FileReader();
            // Uses a Filereader to convert the blob to a base64 string
            // This format is useful for sending audio to a server or storing it in a databse
            reader.onloadend = () => {
                const base64Audio = reader.result;
                const newExercise = {
                id: Date.now(),
                audioData: base64Audio,
                correctAnswer: correctAnswer,
            };
            console.log(newExercise)
            onSave(newExercise);
            // Calls onSave to pass the data back to the parent component
            setCorrectAnswer("")
            };

            reader.readAsDataURL(blob);
            // Async file reading operation
            // Tells FileReader to read the Blob object and convert it into 
            // base64-encoded Data URL.  It triggers onloadend event handler.
            // This is what reader.result becomes
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        // .start() and .stop() are defined at the bottom of the function 
        // after all event handlers are set up
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