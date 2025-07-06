import { useState, useEffect } from 'react';
import RecordingComponent from './RecordingComponent';
import FolderManager from './FolderManager';
import ExerciseList from './ExerciseList';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';
import NavLinks from './NavLinks';

function TeacherPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const { user } = useUserStore();

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchStudents();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_URL}/folders/${user._id}`);
      const folderData = await response.json();
      setFolders(folderData);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const allUsers = await response.json();
      setStudents(allUsers.filter((u) => u.role === 'student'));
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchExercisesForFolder = async (folderId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/exercises/folder/${folderId}`);
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    fetchExercisesForFolder(folder._id);
    setSelectedExerciseIds([]);
  };

  const addExercise = async (exercise) => {
    try {
      const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...exercise, teacherId: user._id })
      });

      if (response.ok && exercise.folderId) {
        const folder = folders.find((f) => f._id === exercise.folderId);
        if (folder) setSelectedFolder(folder);
        await fetchExercisesForFolder(exercise.folderId);
        await fetchFolders();
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const deleteExercise = async (id) => {
    setExercises((prev) => prev.filter((ex) => ex._id !== id));
    try {
      const response = await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete exercise on server');
      await fetchFolders();
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      if (selectedFolder) fetchExercisesForFolder(selectedFolder._id);
    }
  };

  const handleRenameExercise = async (exerciseId, newName) => {
    setExercises((prev) =>
      prev.map((ex) => (ex._id === exerciseId ? { ...ex, correctAnswer: newName } : ex))
    );

    try {
      const response = await fetch(`${API_URL}/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctAnswer: newName })
      });
      if (!response.ok) throw new Error('Failed to rename exercise on server');
    } catch (error) {
      console.error('Failed to rename exercise:', error);
      if (selectedFolder) fetchExercisesForFolder(selectedFolder._id);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseIds: selectedExerciseIds,
          studentIds: selectedStudentIds
        })
      });

      if (response.ok) {
        alert('Exercises assigned successfully!');
        setSelectedExerciseIds([]);
        setSelectedStudentIds([]);
      } else {
        alert('Failed to assign exercises.');
      }
    } catch (error) {
      console.error('Assignment failed:', error);
      alert('Error occurred during assignment.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 text-white px-4">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-2 py-6 sm:px-4 sm:py-8 overflow-auto">
      {/* Breadcrumbs */}
      <div className="w-full max-w-md sm:max-w-4xl mb-4">
        <NavLinks
          links={[
            { label: 'Home', to: '/' },
            { label: 'Teacher Dashboard', to: '/TeacherPage' },
            selectedFolder ? { label: selectedFolder.name, to: '#' } : null
          ].filter(Boolean)}
          isBreadcrumb
        />
      </div>

      <div className="w-full max-w-md sm:max-w-4xl bg-[#334155] rounded-xl shadow-xl p-4 sm:p-6 flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl text-white font-bold text-center">
          Welcome, {user?.fullName || 'Teacher'}!
        </h1>

        {/* Tabs */}
        <div className="flex bg-slate-600 rounded-md overflow-hidden">
          {['create', 'assign'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs sm:text-sm px-3 py-2 font-medium transition focus:outline-none ${
                activeTab === tab
                  ? 'bg-orange-400 text-black'
                  : 'text-white hover:bg-slate-500'
              }`}
            >
              {tab === 'create' ? 'Create & Organize' : 'Assign Exercises'}
            </button>
          ))}
        </div>

        <FolderManager
          teacherId={user._id}
          onFolderSelect={handleFolderSelect}
          selectedFolder={selectedFolder}
          folders={folders}
        />

        {selectedFolder && (
          <div className="text-center text-white text-sm">
            Selected Folder: <span className="text-orange-400 font-medium">{selectedFolder.name}</span>
            <span className="ml-2 opacity-75">
              ({exercises.length} exercise{exercises.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {activeTab === 'create' ? (
          <>
            <RecordingComponent
              onSave={addExercise}
              teacherId={user._id}
              folders={folders}
            />

            {loading ? (
              <div className="flex justify-center py-8">
                <PuffLoader color="#ffffff" size={40} speedMultiplier={1.2} />
              </div>
            ) : (
              selectedFolder && (
                <ExerciseList
                  exercises={exercises}
                  onDelete={deleteExercise}
                  loading={loading}
                  onRename={handleRenameExercise}
                />
              )
            )}
          </>
        ) : (
          <div className="space-y-6">
            {!selectedFolder ? (
              <div className="text-white text-center text-sm bg-slate-600 rounded p-4">
                Select a folder above to begin assigning exercises
              </div>
            ) : (
              <>
                <div className="bg-slate-600 rounded-lg p-3">
                  <h3 className="text-white text-sm font-semibold mb-2">
                    Select Exercises from "{selectedFolder.name}"
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
                        <label key={ex._id} className="flex items-center text-sm text-white p-1 rounded hover:bg-slate-700">
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
                      {selectedExerciseIds.length} exercise{selectedExerciseIds.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                <div className="bg-slate-600 rounded-lg p-3">
                  <h3 className="text-white text-sm font-semibold mb-2">Select Students</h3>
                  {students.length === 0 ? (
                    <p className="text-white text-xs">No students found.</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {students.map((st) => (
                        <label key={st._id} className="flex items-center text-sm text-white p-1 rounded hover:bg-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(st._id)}
                            onChange={() => toggleStudent(st._id)}
                            className="mr-2 w-4 h-4"
                          />
                          <span className="truncate">{st.fullName || 'Unnamed Student'}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedStudentIds.length > 0 && (
                    <div className="mt-2 p-2 bg-orange-400 rounded text-black text-xs">
                      {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleAssign}
                    disabled={selectedExerciseIds.length === 0 || selectedStudentIds.length === 0 || assignmentLoading}
                    className={`w-full sm:w-auto px-6 py-2 rounded-md text-sm font-semibold transition ${
                      selectedExerciseIds.length === 0 || selectedStudentIds.length === 0 || assignmentLoading
                        ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {assignmentLoading ? (
                      <div className="flex items-center gap-2 justify-center">
                        <PuffLoader color="#ffffff" size={16} speedMultiplier={1.2} />
                        Assigning...
                      </div>
                    ) : (
                      `Assign ${selectedExerciseIds.length || 0} Exercise${selectedExerciseIds.length !== 1 ? 's' : ''} to ${selectedStudentIds.length || 0} Student${selectedStudentIds.length !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <NavLinks
          links={[{ label: 'Manage Assignments →', to: '/TeacherExercisesManager' }]}
        />
      </div>

      <div className="w-full max-w-md sm:max-w-4xl mt-4">
        <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isPrimary />
      </div>
    </div>
  );
}

export default TeacherPage;