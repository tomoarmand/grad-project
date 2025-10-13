import { useState, useEffect } from 'react';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore';

function AssignTab({ user }) {
  const { getAuthHeader } = useUserStore();
  const [folders, setFolders] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user) {
      fetchStudents();
      fetchFolders();
    }
  }, [user]);

  // Auto-clear feedback messages after 3 seconds
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

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/folders/${user._id}`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setFolders(
        data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      );
    } catch (error) {
      setError(`Failed to load folders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (id) => {
    const newSelection = selectedFolderIds.includes(id) 
      ? selectedFolderIds.filter((i) => i !== id) 
      : [...selectedFolderIds, id];
    setSelectedFolderIds(newSelection);
  };

  const toggleStudent = (id) => {
    const newSelection = selectedStudentIds.includes(id) 
      ? selectedStudentIds.filter((i) => i !== id) 
      : [...selectedStudentIds, id];
    setSelectedStudentIds(newSelection);
  };

  const handleAssign = async () => {
    if (selectedFolderIds.length === 0 || selectedStudentIds.length === 0) {
      return setFeedback({ type: 'error', msg: 'Select both folders and students.' });
    }
    setAssignmentLoading(true);
    try {
      const response = await fetch(`${API_URL}/folder-assignments/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ folderIds: selectedFolderIds, studentIds: selectedStudentIds }),
      });
      if (response.ok) {
        const folderText = selectedFolderIds.length === 1 ? 'Folder' : 'Folders';
        setFeedback({ type: 'success', msg: `${folderText} assigned successfully!` });
        setSelectedFolderIds([]);
        setSelectedStudentIds([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setFeedback({ type: 'error', msg: errorData.error || 'Failed to assign folders' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Error occurred during assignment.' });
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Mobile-optimized feedback bar */}
      {feedback && (
        <div
          className={`fixed top-4 left-4 right-4 mx-auto max-w-sm px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-500 z-50 ${
            feedback.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{feedback.msg}</span>
            <button 
              onClick={() => setFeedback(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && <div className="bg-red-600 text-white p-3 rounded-lg text-sm">{error}</div>}

      {/* Folders */}
      <div className="bg-slate-600 rounded-lg p-3">
        <h3 className="text-white text-sm font-semibold mb-2">
          Select Folders to Assign
        </h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <PuffLoader color="#ffffff" size={25} />
          </div>
        ) : folders.length === 0 ? (
          <p className="text-white text-xs">No folders found. Create some folders first.</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {folders.map((folder) => (
              <label
                key={folder._id}
                className="flex items-center text-sm text-white p-1 rounded hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedFolderIds.includes(folder._id)}
                  onChange={() => toggleFolder(folder._id)}
                  className="mr-2 w-4 h-4"
                />
                <span className="truncate">
                  {folder.name}
                </span>
              </label>
            ))}
          </div>
        )}
        {selectedFolderIds.length > 0 && (
          <div className="mt-2 p-2 bg-orange-400 rounded text-black text-xs">
            {selectedFolderIds.length} folder
            {selectedFolderIds.length !== 1 ? 's' : ''} selected
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
                  className="mr-2 w-4 h-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">
                    {st.fullName || 'Unnamed Student'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {st.email.length > 25 ? st.email.substring(0, 25) + '...' : st.email}
                  </div>
                </div>
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
            selectedFolderIds.length === 0 ||
            selectedStudentIds.length === 0 ||
            assignmentLoading ||
            studentsLoading
          }
          className={`w-full sm:w-auto px-6 py-2 rounded-md text-sm font-semibold transition ${
            selectedFolderIds.length === 0 ||
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
            `Assign ${selectedFolderIds.length || 0} Folder${
              selectedFolderIds.length !== 1 ? 's' : ''
            } to ${selectedStudentIds.length || 0} Student${
              selectedStudentIds.length !== 1 ? 's' : ''
            }`
          )}
        </button>
      </div>
    </div>
  );
}

export default AssignTab;