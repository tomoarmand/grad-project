import { useState, useEffect } from 'react';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore';
import ConfirmDialog from './ConfirmDialog';
import StudentPasswordReset from './StudentPasswordReset';

function UnassignTab({ user }) {
  const { getAuthHeader } = useUserStore();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUnassignAllDialog, setShowUnassignAllDialog] = useState(false);
  const [resetPasswordStudent, setResetPasswordStudent] = useState(null);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/folder-assignments/students/by-teacher/${user._id}`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch students: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const sortedStudents = data.sort((a, b) => 
        (a.fullName || 'Unnamed Student').toLowerCase().localeCompare(
          (b.fullName || 'Unnamed Student').toLowerCase()
        )
      );
      setStudents(sortedStudents);
      console.log('✅ Successfully fetched students with folder assignments:', sortedStudents.length);
      
    } catch (error) {
      console.error("Failed to fetch students with folder assignments:", error);
      setError(`Failed to load students: ${error.message}`);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchFolders = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/folder-assignments/student/${student._id}/folders`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch folders: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const sortedFolders = data.sort((a, b) => {
        const nameA = (a.name || 'Folder name missing').toLowerCase();
        const nameB = (b.name || 'Folder name missing').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setFolders(sortedFolders);
    } catch (error) {
      console.error("Failed to fetch folders for unassign:", error);
      setError(`Failed to load folders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (folderId) => {
    try {
      const res = await fetch(`${API_URL}/folder-assignments/unassign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          folderId,
          studentId: selectedStudent._id,
        }),
      });
      
      if (res.ok) {
        // Refresh the folders for the selected student
        fetchFolders(selectedStudent);
        // Also refresh the student list in case this was their last assignment
        fetchStudents();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to unassign folder: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to unassign:", error);
      alert('Error occurred while unassigning folder.');
    }
  };

  const confirmUnassignAll = () => {
    setShowUnassignAllDialog(true);
  };

  const handleUnassignAll = async () => {
    try {
      // Unassign all folders for this student
      const unassignPromises = folders.map(folder => 
        fetch(`${API_URL}/folder-assignments/unassign`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            folderId: folder._id,
            studentId: selectedStudent._id,
          }),
        })
      );

      const results = await Promise.all(unassignPromises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        setShowUnassignAllDialog(false);
        // Refresh both lists
        await fetchStudents();
        // Clear selected student since they have no more assignments
        setSelectedStudent(null);
        setFolders([]);
      } else {
        alert('Some folders failed to unassign. Please try again.');
      }
    } catch (error) {
      console.error("Failed to unassign all folders:", error);
      alert('Error occurred while unassigning folders.');
    }
  };

  const handlePasswordResetSuccess = (password) => {
    setNewPasswordValue(password);
    setShowPasswordSuccess(true);
    setResetPasswordStudent(null);
  };

  // Reset when component unmounts or when switching tabs
  const resetState = () => {
    setSelectedStudent(null);
    setFolders([]);
    setError('');
  };

  // Expose reset function to parent component
  useEffect(() => {
    return () => resetState();
  }, []);

  return (
    <div className="space-y-6">
      {/* Show error message if any */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Password reset success message */}
      {showPasswordSuccess && (
        <div className="bg-green-600 text-white p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold mb-1">✅ Password Reset Successfully!</p>
              <p className="text-sm">New password: <span className="font-mono font-bold">{newPasswordValue}</span></p>
              <p className="text-xs mt-1 opacity-90">Share this with the student.</p>
            </div>
            <button
              onClick={() => setShowPasswordSuccess(false)}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-600 rounded-lg p-4">
        <h3 className="text-white text-lg font-semibold mb-3">Select a Student</h3>
        
        {studentsLoading ? (
          <div className="flex justify-center py-4">
            <PuffLoader color="#ffffff" size={25} speedMultiplier={1.2} />
          </div>
        ) : students.length === 0 ? (
          <p className="text-white text-base">No students with folder assignments found.</p>
        ) : (
          <select
            onChange={(e) => {
              const student = students.find(s => s._id === e.target.value);
              if (student) fetchFolders(student);
            }}
            className="w-full bg-slate-700 text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            defaultValue=""
            key={students.length}
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
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-lg font-semibold">
              Assigned Folders for{' '}
              <span className="text-orange-400">{selectedStudent.fullName}</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setResetPasswordStudent(selectedStudent)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium underline transition"
              >
                Reset Password
              </button>
              {folders.length > 0 && (
                <button
                  onClick={confirmUnassignAll}
                  className="text-red-400 hover:text-red-300 text-sm font-medium underline transition"
                >
                  Unassign All
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <PuffLoader color="#ffffff" size={40} speedMultiplier={1.2} />
            </div>
          ) : folders.length === 0 ? (
            <p className="text-white text-base">No folders assigned to this student.</p>
          ) : (
            <>
              <div className="mb-4 p-3 bg-orange-400 rounded-lg text-black text-base font-medium">
                {folders.length} folder{folders.length !== 1 ? 's' : ''} assigned
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {folders.map(folder => (
                  <div
                    key={folder._id}
                    className="bg-slate-700 p-4 rounded-lg flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-white text-base font-medium flex-grow">
                        {folder.name || 'Folder name missing'}
                      </p>
                      <button
                        onClick={() => handleUnassign(folder._id)}
                        className="text-yellow-300 hover:text-yellow-400 transition text-sm font-medium bg-slate-600 px-3 py-2 rounded-lg flex-shrink-0"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Unassign all confirmation */}
      <ConfirmDialog
        isOpen={showUnassignAllDialog}
        onClose={() => setShowUnassignAllDialog(false)}
        onConfirm={handleUnassignAll}
        title="Unassign All Folders"
        message={`Are you sure you want to unassign ALL ${folders.length} folder${folders.length !== 1 ? 's' : ''} from ${selectedStudent?.fullName}? This action cannot be undone.`}
        confirmText="Unassign All"
        cancelText="Cancel"
        type="danger"
      />

      {/* Password reset modal */}
      {resetPasswordStudent && (
        <StudentPasswordReset
          student={resetPasswordStudent}
          onClose={() => setResetPasswordStudent(null)}
          onSuccess={handlePasswordResetSuccess}
        />
      )}
    </div>
  );
}

export default UnassignTab;