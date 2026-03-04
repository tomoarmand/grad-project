import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';
import NavLinks from './NavLinks';

function AssignmentPage() {
  const { user } = useUserStore();
  const [folders, setFolders] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

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
      setLoadingExercises(true);
      const res = await fetch(`${API_URL}/exercises/folder/${folderId}`);
      const data = await res.json();
      setExercises(data);
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
    } finally {
      setLoadingExercises(false);
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-6 flex flex-col gap-6 mt-4">

        <h1 className="text-3xl font-heading uppercase tracking-wide text-center text-white">
          Assign Exercises
        </h1>

        <div>
          <label className="block mb-2 text-sm font-body text-gray-300">Choose Folder</label>
          <select
            value={selectedFolderId}
            onChange={handleFolderChange}
            className="bg-neutral-800 border border-white/10 text-white w-full mb-4 p-2 rounded focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)]"
          >
            <option value="">Select Folder</option>
            {folders.map(f => (
              <option key={f._id} value={f._id}>
                {f.name?.trim() || "(Unnamed Folder)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-heading uppercase tracking-wide mb-2 text-white">
            Select Exercises
          </h2>
          {loadingExercises ? (
            <div className="flex justify-center py-4">
              <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-sm font-body text-gray-400">No exercises found in this folder.</p>
          ) : (
            exercises.map(ex => (
              <label key={ex._id} className="flex items-center mb-1 font-body text-gray-200 text-sm">
                <input
                  type="checkbox"
                  checked={selectedExerciseIds.includes(ex._id)}
                  onChange={() => toggleExercise(ex._id)}
                  className="mr-2 accent-red-600"
                />
                {ex.correctAnswer?.trim() || ex.question?.trim() || "Exercise name missing"}
              </label>
            ))
          )}
        </div>

        <div>
          <h2 className="text-lg font-heading uppercase tracking-wide mb-2 text-white">
            Select Students
          </h2>
          {students.length === 0 ? (
            <p className="text-sm font-body text-gray-400">No students found.</p>
          ) : (
            students.map(st => (
              <label key={st._id} className="flex items-center mb-1 font-body text-gray-200 text-sm">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(st._id)}
                  onChange={() => toggleStudent(st._id)}
                  className="mr-2 accent-red-600"
                />
                {st.fullName || "Unnamed Student"}
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleAssign}
          disabled={selectedExerciseIds.length === 0 || selectedStudentIds.length === 0}
          className={`w-full py-3 rounded text-lg font-heading uppercase tracking-wide text-white shadow-lg transition ${
            selectedExerciseIds.length === 0 || selectedStudentIds.length === 0
              ? 'bg-gray-600 cursor-not-allowed text-gray-400'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Assign
        </button>

        {/* Contextual navigation links inside card */}
        <NavLinks
          links={[
            { label: '← Back to Teacher Page', to: '/TeacherPage' },
            { label: 'Go to Exercise Manager →', to: '/TeacherExercisesManager' },
          ]}
        />
      </div>

      {/* Home link outside the card */}
      <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isPrimary />
    </div>
  );
}

export default AssignmentPage;