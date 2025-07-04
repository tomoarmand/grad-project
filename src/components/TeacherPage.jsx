import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import FolderManager from './FolderManager';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';

function TeacherPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_URL}/folders/${user._id}`);
      const folderData = await response.json();
      setFolders(folderData);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const fetchExercisesForFolder = async (folderId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/exercises/folder/${folderId}`);
      const data = await response.json();
      setExercises(data);
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    fetchExercisesForFolder(folder._id);
  };

  const addExercise = async (exercise) => {
    try {
      const response = await fetch(`${API_URL}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...exercise,
          teacherId: user._id,
        }),
      });
      if (response.ok && exercise.folderId) {
        // Find folder object by id
        const folder = folders.find((f) => f._id === exercise.folderId);
        if (folder) {
          setSelectedFolder(folder);
        }
        await fetchExercisesForFolder(exercise.folderId);
      }
    } catch (error) {
      console.error("Failed to add exercise:", error);
    }
  };

  const deleteExercise = async (id) => {
    setExercises((prev) => prev.filter((ex) => ex._id !== id));

    try {
      const res = await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete exercise on server");
      }
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      if (selectedFolder) {
        fetchExercisesForFolder(selectedFolder._id);
      }
    }
  };

  const handleRenameExercise = async (exerciseId, newName) => {
    setExercises((prevExercises) =>
      prevExercises.map((ex) =>
        ex._id === exerciseId ? { ...ex, correctAnswer: newName } : ex
      )
    );

    try {
      const res = await fetch(`${API_URL}/exercises/${exerciseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctAnswer: newName }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename exercise on server");
      }
    } catch (error) {
      console.error("Failed to rename exercise:", error);
      if (selectedFolder) {
        fetchExercisesForFolder(selectedFolder._id);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 text-white px-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-start bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 py-12 overflow-auto">
      <div className="w-full max-w-md bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 flex flex-col items-center gap-6">
        <h1 className="text-3xl sm:text-4xl text-white font-bold mb-4 text-center">
          Welcome, {user?.fullName || "Teacher"}!
        </h1>
        {/* Folder Manager */}
        <FolderManager teacherId={user._id} onFolderSelect={handleFolderSelect} selectedFolder={selectedFolder} />

        {/* Show selected folder */}
        {selectedFolder && (
          <p className="text-white text-center font-medium mt-1 mb-3">
            Selected Folder: {selectedFolder.name}
          </p>
        )}

        <RecordingComponent
          onSave={(exercise) => addExercise(exercise)}
          teacherId={user._id}
          folders={folders}
        />

        {loading ? (
          <div className="flex justify-center my-8">
            <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
          </div>
        ) : (
          selectedFolder && (
            <ExerciseList
              exercises={exercises}
              onDelete={deleteExercise}
              loading={loading}
              onRename={handleRenameExercise}
            />
          )
        )}

        <Link
          to="/AssignmentPage"
          className="text-orange-300 underline text-center hover:text-orange-400 transition mt-6"
        >
          Go to Assignment Page →
        </Link>
      </div>

      {/* Back link outside card */}
      <Link
        to="/"
        className="mt-6 text-orange-200 text-lg font-semibold hover:underline"
      >
        ← Back to Home
      </Link>
    </div>
  );
}

export default TeacherPage;