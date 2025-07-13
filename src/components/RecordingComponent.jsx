

import { useState, useRef } from "react";
import useFABStore from '../store/fabStore';

function RecordingComponent({ onSave, teacherId, selectedFolder }) {
  const [isRecording, setIsRecording] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const inputRef = useRef(null);
  const { setInsertSymbol, showFAB, hideFAB } = useFABStore();

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const handleInputFocus = () => {
    setInsertSymbol((symbol) => {
      if (inputRef.current) {
        const cursorPos = inputRef.current.selectionStart;
        const currentValue = inputRef.current.value;
        const newValue = currentValue.slice(0, cursorPos) + symbol + currentValue.slice(cursorPos);
        setCorrectAnswer(newValue);
        setTimeout(() => {
          inputRef.current.setSelectionRange(cursorPos + symbol.length, cursorPos + symbol.length);
          inputRef.current.focus();
        }, 0);
      }
    });
    showFAB();
  };

  const handleInputBlur = (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
      setTimeout(() => {
        hideFAB();
      }, 150);
    }
  };

  const getAudioMimeType = () => {
    const preferred = "audio/mp4";
    return MediaRecorder.isTypeSupported(preferred) ? preferred : "audio/webm";
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getAudioMimeType();
    const options = { mimeType };

    mediaRecorderRef.current = new MediaRecorder(stream, options);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: mimeType });
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Audio = reader.result;
        const newExercise = {
          audioData: base64Audio,
          correctAnswer,
          userId: teacherId,
          folderId: selectedFolder._id,
        };

        onSave(newExercise);
        setCorrectAnswer("");
        hideFAB();
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
        <input
          ref={inputRef}
          className="w-full px-3 py-2 rounded bg-white text-black placeholder-slate-500 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition text-base"
          type="text"
          placeholder="Enter correct answer here"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      )}

      {!isRecording ? (
        <button
          className={`w-full py-2 rounded text-white font-semibold transition duration-200 ${
            correctAnswer.trim()
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

