import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';

function TeacherPage() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const { user } = useUserStore();

    const API_URL = import.meta.env.VITE_API_URL;

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/users`);
            const allUsers = await response.json();
            const studentUsers = allUsers.filter(u => u.role === 'student');
            setStudents(studentUsers);
        } catch (error) {
            console.error("Failed to fetch students:", error);
        }
    }

    const fetchExercises = async (studentId) => {
        if (!user) return;

        setLoading(true);
        if (!studentId) {
            setExercises([]);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/exercises?userId=${user._id}&studentId=${studentId}`);
            const stored = await response.json();
            setExercises(stored);
        } catch (error) {
            console.error("Failed to fetch exercises:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) fetchStudents();
    }, [user]);

    const addExercise = async (exercise) => {
        try {
            const exerciseWithTeacherAndStudent = {
                ...exercise,
                userId: user._id,
                studentId: exercise.studentId,
            };
            const response = await fetch(`${API_URL}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exerciseWithTeacherAndStudent),
            });
            const data = await response.json();
            exerciseWithTeacherAndStudent._id = data._id;
            setExercises(prev => [...prev, exerciseWithTeacherAndStudent]);
        } catch (error) {
            console.error("Failed to add exercise:", error);
        }
    }

    const deleteExercise = async (id) => {
        try {
            await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
                method: "DELETE",
            });
            fetchExercises(selectedStudentId);
        } catch (error) {
            console.error("Failed to delete exercise:", error);
        }
    }

    const handleStudentSelection = (event) => {
        const studentId = event.target.value;
        setSelectedStudentId(studentId);
        fetchExercises(studentId);
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

      {/* Student Selector */}
      <select
        className="w-full text-center text-lg rounded bg-[#f8fafc] text-black h-11 px-3 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
        value={selectedStudentId}
        onChange={handleStudentSelection}
      >
        <option value="">Select Student</option>
        {students.map(student => (
          <option key={student._id} value={student._id}>{student.fullName}</option>
        ))}
      </select>

      {/* ExerciseList */}
      <ExerciseList exercises={exercises} onDelete={deleteExercise} loading={loading} />

      {/* RecordingComponent */}
      <RecordingComponent
        onSave={addExercise}
        students={students}
        teacherId={user._id}
        selectedStudentId={selectedStudentId}
      />
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