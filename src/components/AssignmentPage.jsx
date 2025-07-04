import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-md bg-[#334155] rounded-xl shadow-xl p-6 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center">Assign Exercises</h1>

        <div>
          <label className="block mb-2 text-sm">Choose Folder</label>
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
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Select Exercises</h2>
          {loadingExercises ? (
            <div className="flex justify-center py-4">
              <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-sm">No exercises found in this folder.</p>
          ) : (
            exercises.map(ex => (
              <label key={ex._id} className="block mb-1">
                <input
                  type="checkbox"
                  checked={selectedExerciseIds.includes(ex._id)}
                  onChange={() => toggleExercise(ex._id)}
                  className="mr-2"
                />
                {ex.correctAnswer?.trim() || ex.question?.trim() || "Exercise name missing"}
              </label>
            ))
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Select Students</h2>
          {students.length === 0 ? (
            <p className="text-sm">No students found.</p>
          ) : (
            students.map(st => (
              <label key={st._id} className="block mb-1">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(st._id)}
                  onChange={() => toggleStudent(st._id)}
                  className="mr-2"
                />
                {st.fullName || "Unnamed Student"}
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleAssign}
          disabled={selectedExerciseIds.length === 0 || selectedStudentIds.length === 0}
          className={`w-full py-3 rounded text-lg font-semibold text-white transition ${
            selectedExerciseIds.length === 0 || selectedStudentIds.length === 0
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          Assign
        </button>

        <div className="flex flex-col gap-2 text-center text-orange-200 text-sm font-semibold mt-4">
          <Link to="/TeacherPage" className="hover:underline">
            ← Back to Teacher Page
          </Link>
          <Link to="/TeacherExercisesManager" className="hover:underline">
            Go to Exercise Manager →
          </Link>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AssignmentPage;
