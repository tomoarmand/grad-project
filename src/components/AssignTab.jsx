import { useState, useEffect } from 'react';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore'; // Import the store

function AssignTab({ user, selectedFolder }) {
  const { getAuthHeader } = useUserStore(); // Get the auth header function
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');

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
    // Reset selections when folder changes
    setSelectedExerciseIds([]);
  }, [selectedFolder]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          ...getAuthHeader(), // Add authentication header
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
      }
      
      const allUsers = await response.json();
      const sortedStudents = allUsers
        .filter((u) => u.role === 'student')
        .sort((a, b) => {
          const nameA = (a.fullName || 'Unnamed Student').toLowerCase();
          const nameB = (b.fullName || 'Unnamed Student').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      setStudents(sortedStudents);
      console.log('✅ Successfully fetched students in AssignTab:', sortedStudents.length);
      
    } catch (error) {
      console.error('Failed to fetch students:', error);
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
        headers: {
          ...getAuthHeader(), // Add auth header for consistency
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const sortedExercises = data.sort((a, b) => {
        const nameA = (a.correctAnswer?.trim() || a.question?.trim() || 'Exercise name missing').toLowerCase();
        const nameB = (b.correctAnswer?.trim() || b.question?.trim() || 'Exercise name missing').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setExercises(sortedExercises);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      setError(`Failed to load exercises: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (id) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedExerciseIds.length === 0 || selectedStudentIds.length === 0) {
      return alert('Select both exercises and students.');
    }
    
    setAssignmentLoading(true);
    try {
      const response = await fetch(`${API_URL}/assignments/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader() // Add auth header
        },
        body: JSON.stringify({
          exerciseIds: selectedExerciseIds,
          studentIds: selectedStudentIds,
        }),
      });

      if (response.ok) {
        alert('Exercises assigned successfully!');
        setSelectedExerciseIds([]);
        setSelectedStudentIds([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to assign exercises: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Assignment failed:', error);
      alert('Error occurred during assignment.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show error message if any */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!selectedFolder ? (
        <div className="w-full bg-slate-600 rounded-lg p-6 text-center">
          <p className="text-white text-lg">📁 Select a folder above to begin assigning exercises</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-600 rounded-lg p-3">
            <h3 className="text-white text-sm font-semibold mb-2">
              Select Exercises from &quot;{selectedFolder.name}&quot;
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <PuffLoader color="#ffffff" size={25} speedMultiplier={1.2} />
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
                      {ex.correctAnswer?.trim() || ex.question?.trim() || 'Exercise name missing'}
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

          <div className="bg-slate-600 rounded-lg p-3">
            <h3 className="text-white text-sm font-semibold mb-2">
              Select Students
              {!studentsLoading && students.length > 0 && (
                <span className="text-orange-400 font-normal ml-1">
                  ({students.length} available)
                </span>
              )}
            </h3>
            
            {studentsLoading ? (
              <div className="flex justify-center py-4">
                <PuffLoader color="#ffffff" size={20} speedMultiplier={1.2} />
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
                  <PuffLoader color="#ffffff" size={16} speedMultiplier={1.2} />
                  Assigning...
                </div>
              ) : studentsLoading ? (
                <div className="flex items-center gap-2 justify-center">
                  <PuffLoader color="#ffffff" size={16} speedMultiplier={1.2} />
                  Loading...
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