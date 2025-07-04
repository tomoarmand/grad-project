import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';

function TeacherExercisesManager() {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore();
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchStudents = async () => {
            const res = await fetch(`${API_URL}/assignments/students/by-teacher/${user._id}`);
            const data = await res.json();
            setStudents(data);
        };
        if (user) fetchStudents();
    }, [user]);

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/exercises?studentId=${student._id}&userId=${user._id}`);
            const data = await res.json();
            setExercises(data);
        } catch (error) {
            console.error("Failed to fetch exercises:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async (exerciseId) => {
        try {
            const res = await fetch(`${API_URL}/assignments/unassign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseId,
                    studentId: selectedStudent._id,
                })
            });
            if (res.ok) {
                handleSelectStudent(selectedStudent);
            }
        } catch (error) {
            console.error("Failed to unassign:", error);
        }
    };

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-start bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 py-12 overflow-auto">
            <div className="w-full max-w-md bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 flex flex-col items-center gap-6">
                <h1 className="text-3xl sm:text-4xl text-white font-bold text-center">
                    Manage Assigned Exercises
                </h1>

                {/* Student Dropdown */}
                <select
                    onChange={(e) => {
                        const student = students.find(s => s._id === e.target.value);
                        handleSelectStudent(student);
                    }}
                    className="w-full bg-slate-700 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                    <option value="">Select a student</option>
                    {students.map(student => (
                        <option key={student._id} value={student._id}>
                            {student.fullName}
                        </option>
                    ))}
                </select>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center mt-6">
                        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
                    </div>
                )}

                {/* Exercise List */}
                {!loading && selectedStudent && exercises.length > 0 && (
                    <ul className="w-full space-y-4">
                        {exercises.map(ex => (
                            <li
                                key={ex._id}
                                className="bg-slate-600 p-4 rounded-xl shadow text-white"
                            >
                                <p className="font-semibold mb-2">Correct Answer: {ex.correctAnswer}</p>
                                <audio controls src={ex.audioData} className="w-full mb-3" />
                                <button
                                    onClick={() => handleUnassign(ex._id)}
                                    className="text-yellow-300 font-medium hover:text-yellow-400 transition"
                                >
                                    Unassign
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && selectedStudent && exercises.length === 0 && (
                    <p className="text-white text-center">No exercises assigned to this student.</p>
                )}

                <Link
                    to="/TeacherPage"
                    className="mt-6 text-orange-300 underline hover:text-orange-400 transition"
                >
                    ← Back to Teacher Page
                </Link>
            </div>

            <Link
                to="/"
                className="mt-6 text-orange-200 text-lg font-semibold hover:underline"
            >
                ← Back to Home
            </Link>
        </div>
    );
}

export default TeacherExercisesManager;