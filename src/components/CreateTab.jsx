import { useState, useEffect } from 'react';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore';

function CreateTab({ user, selectedFolder }) {
  const { getAuthHeader } = useUserStore();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (selectedFolder) {
      fetchExercisesForFolder(selectedFolder._id);
    } else {
      setExercises([]);
    }
  }, [selectedFolder]);

  const fetchExercisesForFolder = async (folderId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/exercises/folder/${folderId}`, {
        headers: {
          ...getAuthHeader(),
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

  const addExercise = async (exercise) => {
    try {
      setError('');
      
      const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ ...exercise, teacherId: user._id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      if (selectedFolder) {
        await fetchExercisesForFolder(selectedFolder._id);
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
      setError(`Failed to create exercise: ${error.message}`);
    }
  };

  const deleteExercise = async (id) => {
    // Optimistic update - remove from UI first
    const originalExercises = [...exercises];
    setExercises((prev) => prev.filter((ex) => ex._id !== id));
    
    try {
      setError('');
      
      const response = await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete exercise: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      // Revert optimistic update on error
      setExercises(originalExercises);
      setError(`Failed to delete exercise: ${error.message}`);
    }
  };

  const handleRenameExercise = async (exerciseId, newName) => {
    // Optimistic update
    const originalExercises = [...exercises];
    setExercises((prev) =>
      prev
        .map((ex) => (ex._id === exerciseId ? { ...ex, correctAnswer: newName } : ex))
        .sort((a, b) => {
          const nameA = (a.correctAnswer?.trim() || a.question?.trim() || '').toLowerCase();
          const nameB = (b.correctAnswer?.trim() || b.question?.trim() || '').toLowerCase();
          return nameA.localeCompare(nameB);
        })
    );

    try {
      setError('');
      
      const response = await fetch(`${API_URL}/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ correctAnswer: newName }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to rename exercise: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to rename exercise:', error);
      // Revert optimistic update on error
      setExercises(originalExercises);
      setError(`Failed to rename exercise: ${error.message}`);
    }
  };

  return (
    <>
      {/* Show error message if any */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <RecordingComponent
        onSave={addExercise}
        teacherId={user._id}
        selectedFolder={selectedFolder}
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
  );
}

export default CreateTab;