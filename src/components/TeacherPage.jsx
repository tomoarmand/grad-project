import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import FolderManager from './FolderManager';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';

function TeacherPage() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore();

    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folders, setFolders] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;

    const fetchFolders = async () => {
        const response = await fetch(`${API_URL}/folders/${user._id}`);
        const folderData = await response.json();
        setFolders(folderData);
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
    }


    const addExercise = async (exercise) => {
        try {
            const response = await fetch(`${API_URL}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exercise),
            });
            const data = await response.json();
            setExercises(prev => [...prev, { ...exercise, _id: data._id }]);
        } catch (error) {
            console.error("Failed to add exercise:", error);
        }
    }

    const deleteExercise = async (id) => {
        try {
            await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
                method: "DELETE",
            });
            fetchExercisesForFolder(selectedFolder._id);
        } catch (error) {
            console.error("Failed to delete exercise:", error);
        }
    }


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
                    Welcome, {user?.fullName || 'Teacher'}!
                </h1>
                {/* Folder Manager */}
                <FolderManager teacherId={user._id} onFolderSelect={handleFolderSelect} />

                {/* Show selected folder (optional) */}
                {selectedFolder && (
                    <p className="text-white text-center">Selected Folder: {selectedFolder.name}</p>
                )}

                <RecordingComponent
                    onSave={(exercise) => addExercise({ ...exercise, folderId: selectedFolder._id })}
                    teacherId={user._id}
                    folders={folders} // optional if needed for dropdown inside RecordingComponent
                />
                {selectedFolder && (
                    <ExerciseList
                        exercises={exercises}
                        onDelete={deleteExercise}
                        loading={loading}
                    />
                )}
                <Link
                    to="/AssignmentPage"
                    className="text-orange-300 underline text-center hover:text-orange-400 transition"
                >
                    Go to Assignment Page →
                </Link>
            </div>

            {/* Move this OUTSIDE the card box */}
            <Link
                to="/"
                className="mt-6 text-orange-200 text-lg font-semibold hover:underline"
            >
                ← Back to Home
            </Link>
        </div>
    );
}

export default TeacherPage