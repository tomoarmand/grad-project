import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';
import NavLinks from './NavLinks';

function TeacherExercisesManager() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_URL}/assignments/students/by-teacher/${user._id}`);
        const data = await res.json();
        setStudents(data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
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
        }),
      });
      if (res.ok) {
        handleSelectStudent(selectedStudent);
      }
    } catch (error) {
      console.error("Failed to unassign:", error);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 px-4 py-8 overflow-auto">
      <div className="w-full max-w-md sm:max-w-xl mb-4">
        <NavLinks
          links={[
            { label: 'Home', to: '/' },
            { label: 'Teacher Dashboard', to: '/TeacherPage' },
            { label: 'Manage Assignments', to: '/TeacherExercisesManager' },
          ]}
          isBreadcrumb
        />
      </div>

      <div className="w-full max-w-md sm:max-w-xl bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-4 sm:p-6 flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-heading uppercase tracking-wide text-white text-center">
          Manage Assigned Exercises
        </h1>

        {/* Student Dropdown */}
        <select
          onChange={(e) => {
            const student = students.find(s => s._id === e.target.value);
            handleSelectStudent(student);
          }}
          className="w-full bg-neutral-800 border border-white/10 text-white rounded p-3 text-sm font-body focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)] transition"
          defaultValue=""
        >
          <option value="" disabled>Select a student</option>
          {students.map(student => (
            <option key={student._id} value={student._id} className="text-black">
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
                className="bg-neutral-800 border border-white/10 p-4 rounded-lg shadow text-white"
              >
                <p className="font-body text-sm mb-2">
                  Correct Answer: <span className="text-white font-medium">{ex.correctAnswer}</span>
                </p>
                <audio controls src={ex.audioData} className="w-full mb-3 rounded" />
                <button
                  onClick={() => handleUnassign(ex._id)}
                  className="text-red-600 hover:text-red-500 font-heading uppercase tracking-wide text-sm transition"
                >
                  Unassign
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && selectedStudent && exercises.length === 0 && (
          <p className="text-gray-400 text-center text-sm font-body">
            No exercises assigned to this student.
          </p>
        )}

        {/* In-card navigation links */}
        <div className="pt-4">
          <NavLinks
            links={[{ label: '← Back to Teacher Page', to: '/TeacherPage' }]}
            isPrimary={false}
          />
        </div>
      </div>

      <div className="w-full max-w-md sm:max-w-xl mt-4">
        <NavLinks
          links={[{ label: '← Back to Home', to: '/' }]}
          isSubtle
        />
      </div>
    </div>
  );
}

export default TeacherExercisesManager;