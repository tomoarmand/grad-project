
import { useState, useEffect } from 'react';
import { PuffLoader } from 'react-spinners';

function UnassignTab({ user }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/assignments/students/by-teacher/${user._id}`);
      const data = await res.json();
      setStudents(data.sort((a, b) => 
        (a.fullName || 'Unnamed Student').toLowerCase().localeCompare(
          (b.fullName || 'Unnamed Student').toLowerCase()
        )
      ));
    } catch (error) {
      console.error("Failed to fetch students with assignments:", error);
    }
  };

  const fetchExercises = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/exercises?studentId=${student._id}&userId=${user._id}`);
      const data = await res.json();
      const sortedExercises = data.sort((a, b) => {
        const nameA = (a.correctAnswer?.trim() || 'Exercise name missing').toLowerCase();
        const nameB = (b.correctAnswer?.trim() || 'Exercise name missing').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setExercises(sortedExercises);
    } catch (error) {
      console.error("Failed to fetch exercises for unassign:", error);
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
        // Refresh the exercises for the selected student
        fetchExercises(selectedStudent);
        // Also refresh the student list in case this was their last assignment
        fetchStudents();
      }
    } catch (error) {
      console.error("Failed to unassign:", error);
    }
  };

  // Reset when component unmounts or when switching tabs
  const resetState = () => {
    setSelectedStudent(null);
    setExercises([]);
  };

  // Expose reset function to parent component
  useEffect(() => {
    return () => resetState();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-600 rounded-lg p-4">
        <h3 className="text-white text-lg font-semibold mb-3">Select a Student</h3>
        {students.length === 0 ? (
          <p className="text-white text-base">No students with assignments found.</p>
        ) : (
          <select
            onChange={(e) => {
              const student = students.find(s => s._id === e.target.value);
              if (student) fetchExercises(student);
            }}
            className="w-full bg-slate-700 text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            defaultValue=""
            key={students.length} // Force re-render when students change
          >
            <option value="" disabled>
              Choose a student...
            </option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.fullName || 'Unnamed Student'}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedStudent && (
        <div className="bg-slate-600 rounded-lg p-4">
          <h3 className="text-white text-lg font-semibold mb-3">
            Assigned to{' '}
            <span className="text-orange-400">{selectedStudent.fullName}</span>
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <PuffLoader color="#ffffff" size={40} speedMultiplier={1.2} />
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-white text-base">No exercises assigned to this student.</p>
          ) : (
            <>
              <div className="mb-4 p-3 bg-orange-400 rounded-lg text-black text-base font-medium">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} assigned
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {exercises.map(ex => (
                  <div
                    key={ex._id}
                    className="bg-slate-700 p-4 rounded-lg flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-white text-base font-medium flex-grow">
                        {ex.correctAnswer?.trim() || 'Exercise name missing'}
                      </p>
                      <button
                        onClick={() => handleUnassign(ex._id)}
                        className="text-yellow-300 hover:text-yellow-400 transition text-sm font-medium bg-slate-600 px-3 py-2 rounded-lg flex-shrink-0"
                      >
                        Unassign
                      </button>
                    </div>
                    <audio 
                      controls 
                      src={ex.audioData} 
                      className="w-full rounded-lg" 
                      style={{height: '40px'}}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UnassignTab;