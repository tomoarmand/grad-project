import { useState } from 'react';

function StudentPasswordReset({ student, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/teacher-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student._id,
          newPassword,
        }),
      });

      if (response.ok) {
        onSuccess(newPassword);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputNormal = 'w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)] transition';
  const inputError = 'w-full px-3 py-2 border border-red-500 rounded bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68)] transition';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-heading uppercase tracking-wide mb-4 text-gray-900">
          Reset Password
        </h2>
        <p className="text-gray-600 font-body mb-4">
          Resetting password for: <strong className="text-gray-900">{student.fullName}</strong>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4 text-sm font-body">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-body text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="text"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={error ? inputError : inputNormal}
              placeholder="Enter new password (min 6 characters)"
              disabled={isLoading}
              maxLength="100"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-body text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="text"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={error ? inputError : inputNormal}
              placeholder="Confirm new password"
              disabled={isLoading}
              maxLength="100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 rounded font-heading uppercase tracking-wide shadow-lg transition ${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 font-heading uppercase tracking-wide text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-xs font-body text-gray-500 mt-4">
          💡 Tip: The password is shown in plain text so you can share it with the student.
        </p>
      </div>
    </div>
  );
}

export default StudentPasswordReset;