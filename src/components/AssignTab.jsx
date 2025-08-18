import { useState, useEffect } from 'react';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore';

function AssignTab({ user, selectedFolder }) {
  const { getAuthHeader } = useUserStore();
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); // ✅ holds success/error messages

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFolder) {
      fetchExercisesForFolder(selectedFolder._id);
    } else {
      setExercises([]);
    }
    setSelectedExerciseIds([]);
  }, [selectedFolder]);

  // ✅ auto-clear feedback after 3s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/users`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const allUsers = await response.json();
      const sortedStudents = allUsers
        .filter((u) => u.role === 'student')
        .sort((a, b) =>
          (a.fullName || 'Unnamed').toLowerCase().localeCompare((b.fullName || 'Unnamed').toLowerCase())
        );
      setStudents(sortedStudents);
    } catch (error) {
      setError(`Failed to load students: ${error.message}`);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchExercisesForFolder = async (folderId) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/exercises/folder/${folderId}`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setExercises(
        data.sort((a, b) =>
          (a.correctAnswer?.trim() || a.question?.trim() || 'Exercise')
            .toLowerCase()
            .localeCompare((b.correctAnswer?.trim() || b.question?.trim() || 'Exercise').toLowerCase())
        )
      );
    } catch (error) {
      setError(`Failed to load exercises: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (id) =>
    setSelectedExerciseIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  const toggleStudent = (id) =>
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleAssign = async () => {
    if (selectedExerciseIds.length === 0 || selectedStudentIds.length === 0) {
      return setFeedback({ type: 'error', msg: 'Select both exercises and students.' });
    }
    setAssignmentLoading(true);
    try {
      const response = await fetch(`${API_URL}/assignments/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ exerciseIds: selectedExerciseIds, studentIds: selectedStudentIds }),
      });

      if (response.ok) {
        setFeedback({ type: 'success', msg: '✅ Exercises assigned successfully!' });
        setSelectedExerciseIds([]);
        setSelectedStudentIds([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setFeedback({ type: 'error', msg: errorData.error || 'Failed to assign exercises' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Error occurred during assignment.' });
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* ✅ floating feedback bar */}
      {feedback && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-500 ${
            feedback.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {error && <div className="bg-red-600 text-white p-3 rounded-lg text-sm">{error}</div>}

      {!selectedFolder ? (
        <div className="w-full bg-slate-600 rounded-lg p-6 text-center">
          <p className="text-white text-lg">📁 Select a folder above to begin assigning exercises</p>
        </div>
      ) : (
        <>
          {/* Exercises */}
          <div className="bg-slate-600 rounded-lg p-3">
            <h3 className="text-white text-sm font-semibold mb-2">
              Select Exercises from &quot;{selectedFolder.name}&quot;
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <PuffLoader color="#ffffff" size={25} />
              </div>
            ) : exercises.length === 0 ? (
              <p className="text-white text-xs">No exercises found in this folder.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {exercises.map((ex) => (
                  <label
                    key={ex._id}
                    className="flex items-center text-sm text-white p-1 rounded hover:bg-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExerciseIds.includes(ex._id)}
                      onChange={() => toggleExercise(ex._id)}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="truncate">
                      {ex.correctAnswer?.trim() || ex.question?.trim() || 'Exercise'}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedExerciseIds.length > 0 && (
              <div className="mt-2 p-2 bg-orange-400 rounded text-black text-xs">
                {selectedExerciseIds.length} exercise
                {selectedExerciseIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Students */}
          <div className="bg-slate-600 rounded-lg p-3">
            <h3 className="text-white text-sm font-semibold mb-2">
              Select Students{' '}
              {!studentsLoading && students.length > 0 && (
                <span className="text-orange-400 font-normal ml-1">({students.length} available)</span>
              )}
            </h3>
            {studentsLoading ? (
              <div className="flex justify-center py-4">
                <PuffLoader color="#ffffff" size={20} />
              </div>
            ) : students.length === 0 ? (
              <p className="text-white text-xs">No students found.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {students.map((st) => (
                  <label
                    key={st._id}
                    className="flex items-center text-sm text-white p-1 rounded hover:bg-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(st._id)}
                      onChange={() => toggleStudent(st._id)}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="truncate">
                      {st.fullName || 'Unnamed Student'}
                      <span className="text-xs text-gray-400 ml-1">({st.email})</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedStudentIds.length > 0 && (
              <div className="mt-2 p-2 bg-orange-400 rounded text-black text-xs">
                {selectedStudentIds.length} student
                {selectedStudentIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Assign button */}
          <div className="flex justify-center">
            <button
              onClick={handleAssign}
              disabled={
                selectedExerciseIds.length === 0 ||
                selectedStudentIds.length === 0 ||
                assignmentLoading ||
                studentsLoading
              }
              className={`w-full sm:w-auto px-6 py-2 rounded-md text-sm font-semibold transition ${
                selectedExerciseIds.length === 0 ||
                selectedStudentIds.length === 0 ||
                assignmentLoading ||
                studentsLoading
                  ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {assignmentLoading ? (
                <div className="flex items-center gap-2 justify-center">
                  <PuffLoader color="#ffffff" size={16} />
                  Assigning...
                </div>
              ) : (
                `Assign ${selectedExerciseIds.length || 0} Exercise${
                  selectedExerciseIds.length !== 1 ? 's' : ''
                } to ${selectedStudentIds.length || 0} Student${
                  selectedStudentIds.length !== 1 ? 's' : ''
                }`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AssignTab;