import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { Link } from 'react-router-dom';

function AssignmentPage() {
    const { user } = useUserStore();
    const [folders, setFolders] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const folderRes = await fetch(`${API_URL}/folders/${user._id}`);
                const foldersData = await folderRes.json();
                setFolders(foldersData);

                const userRes = await fetch(`${API_URL}/users`);
                const allUsers = await userRes.json();
                setStudents(allUsers.filter(u => u.role === 'student'));
            } catch (err) {
                console.error("Failed to fetch folders or users", err);
            }
        };
        if (user) fetchData();
    }, [user]);

    const fetchExercises = async (folderId) => {
        try {
            const res = await fetch(`${API_URL}/exercises/folder/${folderId}`);
            const data = await res.json();
            setExercises(data);
        } catch (err) {
            console.error("Failed to fetch exercises:", err);
        }
    };

    const handleFolderChange = (e) => {
        const folderId = e.target.value;
        setSelectedFolderId(folderId);
        fetchExercises(folderId);
    };

    const toggleExercise = (id) => {
        setSelectedExerciseIds((prev) =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleStudent = (id) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAssign = async () => {
        if (selectedExerciseIds.length === 0 || selectedStudentIds.length === 0) {
            return alert('Select both exercises and students.');
        }
        try {
            const res = await fetch(`${API_URL}/assignments/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exerciseIds: selectedExerciseIds, studentIds: selectedStudentIds })
            });
            if (res.ok) {
                alert('Exercises assigned successfully!');
                setSelectedExerciseIds([]);
                setSelectedStudentIds([]);
            } else {
                alert('Failed to assign exercises.');
            }
        } catch (err) {
            console.error("Assignment failed:", err);
            alert('Error occurred during assignment.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6 max-w-3xl mx-auto text-white">
            <h1 className="text-3xl mb-4 font-bold">Assign Exercises</h1>

            <label className="block mb-2">Choose Folder</label>
            <select
                value={selectedFolderId}
                onChange={handleFolderChange}
                className="bg-white text-black w-full mb-4 p-2 rounded"
            >
                <option value="">Select Folder</option>
                {folders.map(f => (
                    <option key={f._id} value={f._id}>
                        {f.name?.trim() || "(Unnamed Folder)"}
                    </option>
                ))}
            </select>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Select Exercises</h2>
                {exercises.length === 0 && <p>No exercises found in this folder.</p>}
                {exercises.map(ex => (
                    <label key={ex._id} className="block text-white">
                        <input
                            type="checkbox"
                            checked={selectedExerciseIds.includes(ex._id)}
                            onChange={() => toggleExercise(ex._id)}
                            className="mr-2"
                        />
                        {ex.correctAnswer?.trim() || ex.question?.trim() || "Exercise name missing"}
                    </label>
                ))}
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Select Students</h2>
                {students.length === 0 && <p>No students found.</p>}
                {students.map(st => (
                    <label key={st._id} className="block text-white">
                        <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(st._id)}
                            onChange={() => toggleStudent(st._id)}
                            className="mr-2"
                        />
                        {st.fullName || "Unnamed Student"}
                    </label>
                ))}
            </div>

            <button
                onClick={handleAssign}
                disabled={selectedExerciseIds.length === 0 || selectedStudentIds.length === 0}
                className={`px-6 py-2 rounded text-white ${
                    selectedExerciseIds.length === 0 || selectedStudentIds.length === 0
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
            >
                Assign
            </button>
            <div className="mb-4 mt-6">
                <Link to="/TeacherPage" className="text-orange-300 underline hover:text-orange-400 mr-4">
                    ← Back to Teacher Page
                </Link>
                <Link to="/" className="text-orange-300 underline hover:text-orange-400">
                    Home
                </Link>
            </div>
        </div>
    );
}

export default AssignmentPage;
