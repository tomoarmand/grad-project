import { useState, useRef } from "react";
import axios from "axios";
import MusicSymbolButton from './MusicSymbolButton';

const CLOUD_NAME = "deac4pk5l";
const UPLOAD_PRESET = "web_audio_upload";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

function RecordingComponent({ onSave, teacherId, selectedFolder }) {
  const [isRecording, setIsRecording] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  const validateCorrectAnswer = (answer) => {
    const sanitized = sanitizeInput(answer);
    if (!sanitized || sanitized.length < 1) return { isValid: false, message: 'Answer is required' };
    if (sanitized.length > 200) return { isValid: false, message: 'Answer must be 200 characters or less' };
    const validAnswerRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_.,!()&♪♫♬♩♭♮♯°]+$/;
    if (!validAnswerRegex.test(sanitized)) return { isValid: false, message: 'Answer contains invalid characters' };
    return { isValid: true, sanitized };
  };

  const validateIds = (teacherId, folderId) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!teacherId || !objectIdRegex.test(teacherId.toString())) return { isValid: false, message: 'Invalid teacher ID' };
    if (!folderId || !objectIdRegex.test(folderId.toString())) return { isValid: false, message: 'Invalid folder ID' };
    return { isValid: true };
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (error) setError('');
  };

  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150);
  };

  const handleCorrectAnswerChange = (value) => {
    if (value.length <= 200) {
      setCorrectAnswer(value);
      if (error) setError('');
    }
  };

  const getAudioMimeType = () => {
    return MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm";
  };

  const startRecording = async () => {
    const answerValidation = validateCorrectAnswer(correctAnswer);
    if (!answerValidation.isValid) {
      setError(answerValidation.message);
      return;
    }

    const idsValidation = validateIds(teacherId, selectedFolder?._id);
    if (!idsValidation.isValid) {
      setError(idsValidation.message);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getAudioMimeType();

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsUploading(true);
        const blob = new Blob(audioChunks.current, { type: mimeType });

        if (blob.size > 10 * 1024 * 1024) {
          setError("Recording is too large. Please record a shorter exercise.");
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", UPLOAD_PRESET);

        try {
          const res = await axios.post(UPLOAD_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
          });

          if (!res.data || !res.data.secure_url) throw new Error("Invalid response from upload service");

          const audioData = res.data.secure_url;

          const finalAnswerValidation = validateCorrectAnswer(correctAnswer);
          const finalIdsValidation = validateIds(teacherId, selectedFolder._id);

          if (!finalAnswerValidation.isValid) {
            setError(finalAnswerValidation.message);
            setIsUploading(false);
            return;
          }

          if (!finalIdsValidation.isValid) {
            setError(finalIdsValidation.message);
            setIsUploading(false);
            return;
          }

          const newExercise = {
            audioData,
            correctAnswer: finalAnswerValidation.sanitized,
            userId: sanitizeInput(teacherId.toString()),
            folderId: sanitizeInput(selectedFolder._id.toString()),
          };

          await onSave(newExercise);
          setCorrectAnswer("");
          setIsInputFocused(false);
          setError("");
        } catch (err) {
          console.error("Upload failed", err);
          if (err.code === 'ECONNABORTED') setError("Upload timed out. Please try again.");
          else if (err.response?.status === 413) setError("File is too large. Please record a shorter exercise.");
          else setError("Upload failed. Please check your connection and try again.");
        } finally {
          setIsUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("Recording error:", event.error);
        setError("Recording failed. Please try again.");
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError("");
    } catch (err) {
      console.error("Failed to start recording", err);
      if (err.name === 'NotAllowedError') setError("Microphone access denied. Please allow microphone access and try again.");
      else if (err.name === 'NotFoundError') setError("No microphone found. Please connect a microphone and try again.");
      else setError("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!selectedFolder) {
    return (
      <div className="w-full bg-neutral-900 border border-white/10 rounded-lg p-6 text-center">
        <p className="text-gray-300 text-lg font-body">
          📁 Select a folder above to create a new exercise
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-6 flex flex-col gap-4">
      <div className="text-left">
        <h2 className="text-2xl font-heading uppercase tracking-wide text-white">New Exercise</h2>
        <p className="text-gray-400 font-body text-sm mt-1">
          Recording to: <span className="text-white font-medium">{sanitizeInput(selectedFolder.name)}</span>
        </p>
      </div>

      {!isRecording && !isUploading && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 w-full items-center">
            <div className="flex-grow min-w-0">
              <input
                ref={inputRef}
                className={`w-full px-3 py-2 rounded bg-neutral-800 text-white placeholder-gray-500 border text-base font-body transition focus:outline-none ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68)]'
                    : 'border-white/10 focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)]'
                }`}
                type="text"
                placeholder="Enter correct answer here..."
                value={correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                maxLength="200"
              />
            </div>
            {isInputFocused && (
              <MusicSymbolButton inputRef={inputRef} setterFunction={setCorrectAnswer} />
            )}
          </div>
          {error && <p className="text-red-500 text-sm font-body">{error}</p>}
        </div>
      )}

      {isUploading && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-red-600 animate-pulse"></div>
            <p className="text-white text-base font-body">Uploading exercise...</p>
          </div>
          <p className="text-gray-400 text-sm font-body">Please wait while we save your recording</p>
        </div>
      )}

      {!isRecording && !isUploading ? (
        <button
          className={`w-full py-2 rounded text-white font-heading uppercase tracking-wide shadow-lg transition duration-200 ${
            correctAnswer.trim() && !error
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-600 cursor-not-allowed text-gray-400"
          }`}
          onClick={startRecording}
          disabled={!correctAnswer.trim() || !!error}
          onMouseDown={(e) => e.preventDefault()}
        >
          Record!
        </button>
      ) : isRecording ? (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-red-600 animate-pulse"></div>
            <p className="text-white text-base font-body">Recording exercise...</p>
          </div>
          <p className="text-gray-400 text-sm font-body">Answer: "{sanitizeInput(correctAnswer)}"</p>
          <button
            onClick={stopRecording}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-heading uppercase tracking-wide shadow-lg transition duration-200"
          >
            Stop & Save
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default RecordingComponent;