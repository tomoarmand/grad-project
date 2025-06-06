import { useState, useRef } from "react";

function RecordingComponent({ onSave }) {
    const [isRecording, setIsRecording] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const mediaRecorderRef = useRef(null);
    // Stores the MediaRecorder object so it persists across renders
    const audioChunks = useRef([]);
    // An array that holds pieces of the audio as they are recorded

    const getAudioMimeType = () => {

        const preferred = "audio/mp4";
        if (MediaRecorder.isTypeSupported(preferred)) {
            return preferred;
        }

        return "audio/webm";
    }

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Asks the browser for permission to use microphone
        // Stream is an audio stream from the mic
        const mimeType = getAudioMimeType();

        const options = { mimeType };

        mediaRecorderRef.current = new MediaRecorder(stream, options)
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
        <div>
            {!isRecording &&
            <input
                className="text-m text-center sm:text-l md:text-xl  text-bl bg-[#f8fafc] h-10"
                autoFocus
                type="text"
                placeholder="Enter correct answer here"
                value={correctAnswer}
                onChange={(event) => setCorrectAnswer(event.target.value)}
            />
        }
            {!isRecording ? (
                <button className="text-lg sm:text-xl md:text-2xl border-none rounded px-4 py-2 ml-4 text-center inline-block text-[#f8fafc] bg-[#64748b] hover:bg-[#fb923c]" onClick={startRecording}>Record!</button>
            ) : (
                <>
                    <div className="flex justify-center items-center">
                    <div className="w-5 h-5 rounded-full border-2 border-red-600 bg-red-600 mr-3"></div><p className="text-lg sm:text-xl md:text-2xl text-[#f8fafc]">Recording exercise...</p>
                    <button className="text-lg sm:text-xl md:text-2xl border-none rounded px-4 py-2 ml-4 text-center inline-block text-[#f8fafc] bg-[#64748b] hover:bg-[#fb923c]" onClick={stopRecording}>Stop & Save</button>
                    </div>
                </>
            )}
            </div>
        </>
    )
}

export default RecordingComponent