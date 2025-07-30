import { useState, useRef } from "react";
import axios from "axios";
import MusicSymbolButton from './MusicSymbolButton';

const CLOUD_NAME = "deac4pk5l"; // replace with your Cloudinary cloud name
const UPLOAD_PRESET = "web_audio_upload"; // the preset you created
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`; // use 'video' for mp4

function RecordingComponent({ onSave, teacherId, selectedFolder }) {
  const [isRecording, setIsRecording] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const handleInputFocus = () => setIsInputFocused(true);

  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150);
  };

  const getAudioMimeType = () => {
    return MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "audio/webm";
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getAudioMimeType();

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: mimeType });

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const res = await axios.post(UPLOAD_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const audioData = res.data.secure_url;

        const newExercise = {
          audioData,
          correctAnswer,
          userId: teacherId,
          folderId: selectedFolder._id,
        };

        onSave(newExercise);
        setCorrectAnswer("");
        setIsInputFocused(false);
      } catch (err) {
        console.error("Cloudinary upload failed", err);
        alert("Upload failed.");
      }
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  if (!selectedFolder) {
    return (
      <div className="w-full bg-slate-600 rounded-md p-6 text-center">
        <p className="text-white text-lg">
          📁 Select a folder above to create a new exercise
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-600 rounded-md shadow-md p-6 flex flex-col gap-4">
      <div className="text-left">
        <h2 className="text-2xl font-bold text-white">New Exercise</h2>
        <p className="text-orange-400 mt-1">
          Recording to: <span className="font-semibold">{selectedFolder.name}</span>
        </p>
      </div>

      {!isRecording && (
        <div className="flex flex-row gap-2 w-full items-center">
          <input
            ref={inputRef}
            className="flex-grow min-w-0 px-3 py-2 rounded bg-white text-black placeholder-slate-500 border border-slate-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition text-base"
            type="text"
            placeholder="Enter correct answer here..."
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {isInputFocused && (
            <MusicSymbolButton inputRef={inputRef} setterFunction={setCorrectAnswer} />
          )}
        </div>
      )}

      {!isRecording ? (
        <button
          className={`w-full py-2 rounded text-white font-semibold transition duration-200 ${correctAnswer.trim()
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-400 cursor-not-allowed"
            }`}
          onClick={startRecording}
          disabled={!correctAnswer.trim()}
          onMouseDown={(e) => e.preventDefault()}
        >
          Record!
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-red-600 animate-pulse"></div>
            <p className="text-white text-base">Recording exercise...</p>
          </div>
          <button
            onClick={stopRecording}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold transition duration-200"
          >
            Stop & Save
          </button>
        </div>
      )}
    </div>
  );
}

export default RecordingComponent;