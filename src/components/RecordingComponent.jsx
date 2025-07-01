import { useState, useRef } from "react";

function RecordingComponent({ onSave, teacherId, folders }) {
  const [isRecording, setIsRecording] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

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
          folderId: selectedFolderId,
        };

        onSave(newExercise);
        setCorrectAnswer("");
        setSelectedFolderId("");
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
    <div className="w-full bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 flex flex-col items-center gap-6">
      <h2 className="text-3xl sm:text-4xl text-white font-bold text-center">New Exercise</h2>

      {/* Folder selector */}
      <select
        className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
        value={selectedFolderId}
        onChange={(e) => setSelectedFolderId(e.target.value)}
        required
      >
        <option value="">Select Folder</option>
        {folders.map(folder => (
          <option key={folder._id} value={folder._id}>{folder.name}</option>
        ))}
      </select>

      {!isRecording && (
        <input
          className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          type="text"
          placeholder="Enter correct answer here"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
        />
      )}
  
      {!isRecording ? (
        <button
          className={`w-full py-3 rounded text-lg sm:text-xl font-semibold text-white transition duration-200 ${
            correctAnswer.trim()
              ? "bg-[#64748b] hover:bg-[#fb923c]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={startRecording}
          disabled={!correctAnswer.trim() || !selectedFolderId}
        >
          Record!
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-red-600 animate-pulse"></div>
            <p className="text-lg sm:text-xl text-white">Recording exercise...</p>
          </div>
          <button
            onClick={stopRecording}
            className="w-full bg-[#64748b] hover:bg-[#fb923c] text-white py-3 rounded text-lg sm:text-xl font-semibold transition duration-200"
          >
            Stop & Save
          </button>
        </div>
      )}
    </div>
  );
}

export default RecordingComponent;