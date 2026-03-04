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
    if (user) fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/folder-assignments/students/by-teacher/${user._id}`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(`Failed to fetch students: ${res.status} ${res.statusText}`);

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
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(`Failed to fetch folders: ${res.status} ${res.statusText}`);

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
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ folderId, studentId: selectedStudent._id }),
      });

      if (res.ok) {
        fetchFolders(selectedStudent);
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

  const confirmUnassignAll = () => setShowUnassignAllDialog(true);

  const handleUnassignAll = async () => {
    try {
      const unassignPromises = folders.map(folder =>
        fetch(`${API_URL}/folder-assignments/unassign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ folderId: folder._id, studentId: selectedStudent._id }),
        })
      );

      const results = await Promise.all(unassignPromises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        setShowUnassignAllDialog(false);
        await fetchStudents();
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

  useEffect(() => {
    return () => {
      setSelectedStudent(null);
      setFolders([]);
      setError('');
    };
  }, []);

  return (
    <div className="space-y-6">

      {/* Error message */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg text-sm font-body">{error}</div>
      )}

      {/* Password reset success */}
      {showPasswordSuccess && (
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-heading uppercase tracking-wide mb-1">✅ Password Reset Successfully!</p>
              <p className="text-sm font-body">
                New password: <span className="font-mono font-bold">{newPasswordValue}</span>
              </p>
              <p className="text-xs font-body mt-1 opacity-90">Share this with the student.</p>
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

      {/* Student selector */}
      <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
        <h3 className="text-white text-lg font-heading uppercase tracking-wide mb-3">
          Select a Student
        </h3>

        {studentsLoading ? (
          <div className="flex justify-center py-4">
            <PuffLoader color="#ffffff" size={25} speedMultiplier={1.2} />
          </div>
        ) : students.length === 0 ? (
          <p className="text-gray-400 text-base font-body">No students with folder assignments found.</p>
        ) : (
          <select
            onChange={(e) => {
              const student = students.find(s => s._id === e.target.value);
              if (student) fetchFolders(student);
            }}
            className="w-full bg-neutral-800 border border-white/10 text-white rounded p-3 text-base font-body focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)] transition"
            defaultValue=""
            key={students.length}
          >
            <option value="" disabled>Choose a student...</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.fullName || 'Unnamed Student'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Assigned folders for selected student */}
      {selectedStudent && (
        <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-lg font-heading uppercase tracking-wide">
              Folders for{' '}
              <span className="text-white normal-case font-body font-medium">
                {selectedStudent.fullName}
              </span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setResetPasswordStudent(selectedStudent)}
                className="text-gray-400 hover:text-white text-sm font-body underline transition"
              >
                Reset Password
              </button>
              {folders.length > 0 && (
                <button
                  onClick={confirmUnassignAll}
                  className="text-red-600 hover:text-red-500 text-sm font-body underline transition"
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
            <p className="text-gray-400 text-base font-body">No folders assigned to this student.</p>
          ) : (
            <>
              <div className="mb-4 p-3 bg-yellow-500 rounded text-black text-base font-body font-medium">
                {folders.length} folder{folders.length !== 1 ? 's' : ''} assigned
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {folders.map(folder => (
                  <div
                    key={folder._id}
                    className="bg-neutral-800 border border-white/10 p-4 rounded-lg flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-white text-base font-body font-medium flex-grow">
                        {folder.name || 'Folder name missing'}
                      </p>
                      <button
                        onClick={() => handleUnassign(folder._id)}
                        className="text-red-600 hover:text-red-500 transition text-sm font-heading uppercase tracking-wide bg-neutral-900 border border-white/10 px-3 py-2 rounded flex-shrink-0"
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