import { useState, useRef } from "react";
import axios from "axios";
import MusicSymbolButton from './MusicSymbolButton';

const CLOUD_NAME = "deac4pk5l"; // replace with your Cloudinary cloud name
const UPLOAD_PRESET = "web_audio_upload"; // the preset you created
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`; // use 'video' for mp4

function RecordingComponent({ onSave, teacherId, selectedFolder }) {
  const [isRecording, setIsRecording] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // INPUT SANITIZATION: Remove dangerous characters and normalize input
  // WHY: Security critical - prevents XSS attacks and ensures clean data
  // NOTE: Removes HTML tags, scripts, and event handlers while preserving musical notation
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  // ANSWER VALIDATION: Ensure exercise answers meet requirements
  // WHY: Maintains data quality and prevents empty or malicious answers
  // NOTE: Allows musical notation characters while enforcing length limits
  const validateCorrectAnswer = (answer) => {
    const sanitized = sanitizeInput(answer);
    if (!sanitized || sanitized.length < 1) {
      return { isValid: false, message: 'Answer is required' };
    }
    if (sanitized.length > 200) {
      return { isValid: false, message: 'Answer must be 200 characters or less' };
    }
    // Allow letters, numbers, spaces, and common musical notation characters
    const validAnswerRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_.,!()&♪♫♬♩♭♮♯°]+$/;
    if (!validAnswerRegex.test(sanitized)) {
      return { isValid: false, message: 'Answer contains invalid characters' };
    }
    return { isValid: true, sanitized };
  };

  // ID VALIDATION: Verify MongoDB ObjectId format for security
  // WHY: Prevents injection attacks and ensures data integrity
  // NOTE: MongoDB ObjectIds are 24-character hexadecimal strings
  const validateIds = (teacherId, folderId) => {
    // Basic validation for MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!teacherId || !objectIdRegex.test(teacherId.toString())) {
      return { isValid: false, message: 'Invalid teacher ID' };
    }
    
    if (!folderId || !objectIdRegex.test(folderId.toString())) {
      return { isValid: false, message: 'Invalid folder ID' };
    }
    
    return { isValid: true };
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Clear error when user focuses input
    if (error) {
      setError('');
    }
  };

  const handleInputBlur = (e) => {
    setTimeout(() => {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-fab]')) {
        setIsInputFocused(false);
      }
    }, 150);
  };

  const handleCorrectAnswerChange = (value) => {
    if (value.length <= 200) { // Enforce max length
      setCorrectAnswer(value);
      // Clear error when user starts typing
      if (error) {
        setError('');
      }
    }
  };

  // AUDIO FORMAT DETECTION: Determine best supported audio format for recording
  // WHY: Ensures cross-browser compatibility for audio recording
  // NOTE: Prefers MP4 for better quality, falls back to WebM for older browsers
  const getAudioMimeType = () => {
    return MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "audio/webm";
  };

  // AUDIO RECORDING: Handle browser MediaRecorder API with comprehensive error handling
  // WHY: Core functionality allowing teachers to record custom audio exercises
  // NOTE: Includes permission handling, format detection, and upload preparation
  const startRecording = async () => {
    // Validate answer before starting recording
    const answerValidation = validateCorrectAnswer(correctAnswer);
    if (!answerValidation.isValid) {
      setError(answerValidation.message);
      return;
    }

    // Validate IDs
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

      // AUDIO DATA COLLECTION: Accumulate audio data in chunks during recording
      // WHY: MediaRecorder provides data in chunks, need to collect them for complete audio
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      // UPLOAD PROCESSING: Handle recording completion and initiate upload
      // WHY: Need to process audio data and send to cloud storage after recording ends
      mediaRecorderRef.current.onstop = async () => {
        setIsUploading(true);
        const blob = new Blob(audioChunks.current, { type: mimeType });

        // FILE SIZE VALIDATION: Prevent abuse with large file uploads
        // WHY: Security measure to prevent storage abuse and long upload times
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
            timeout: 30000 // 30 second timeout
          });

          if (!res.data || !res.data.secure_url) {
            throw new Error("Invalid response from upload service");
          }

          const audioData = res.data.secure_url;

          // Final validation before saving
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
            audioData: audioData,
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
          if (err.code === 'ECONNABORTED') {
            setError("Upload timed out. Please try again.");
          } else if (err.response?.status === 413) {
            setError("File is too large. Please record a shorter exercise.");
          } else {
            setError("Upload failed. Please check your connection and try again.");
          }
        } finally {
          setIsUploading(false);
        }

        // Clean up media stream
        stream.getTracks().forEach(track => track.stop());
      };

      // ERROR HANDLING: Handle recording failures gracefully
      // WHY: Recording can fail due to permissions, hardware issues, or browser limitations
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
      // PERMISSION & COMPATIBILITY HANDLING: Handle various recording failure scenarios
      // WHY: Different browsers and devices have different audio recording capabilities
      console.error("Failed to start recording", err);
      if (err.name === 'NotAllowedError') {
        setError("Microphone access denied. Please allow microphone access and try again.");
      } else if (err.name === 'NotFoundError') {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError("Failed to start recording. Please try again.");
      }
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
          Recording to: <span className="font-semibold">{sanitizeInput(selectedFolder.name)}</span>
        </p>
      </div>

      {!isRecording && !isUploading && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 w-full items-center">
            <div className="flex-grow min-w-0">
              <input
                ref={inputRef}
                className={`w-full px-3 py-2 rounded bg-white text-black placeholder-slate-500 border text-base transition ${
                  error 
                    ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]' 
                    : 'border-slate-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {isUploading && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-500 animate-pulse"></div>
            <p className="text-white text-base">Uploading exercise...</p>
          </div>
          <p className="text-slate-300 text-sm">Please wait while we save your recording</p>
        </div>
      )}

      {!isRecording && !isUploading ? (
        <button
          className={`w-full py-2 rounded text-white font-semibold transition duration-200 ${
            correctAnswer.trim() && !error
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-400 cursor-not-allowed"
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
            <p className="text-white text-base">Recording exercise...</p>
          </div>
          <p className="text-slate-300 text-sm">Answer: "{sanitizeInput(correctAnswer)}"</p>
          <button
            onClick={stopRecording}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold transition duration-200"
          >
            Stop & Save
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default RecordingComponent;