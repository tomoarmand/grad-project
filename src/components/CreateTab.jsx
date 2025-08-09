import { useState, useEffect } from 'react';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { PuffLoader } from 'react-spinners';

function CreateTab({ user, selectedFolder }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(`${API_URL}/exercises/folder/${folderId}`);
      const data = await response.json();
      const sortedExercises = data.sort((a, b) => {
        const nameA = (a.correctAnswer?.trim() || a.question?.trim() || 'Exercise name missing').toLowerCase();
        const nameB = (b.correctAnswer?.trim() || b.question?.trim() || 'Exercise name missing').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setExercises(sortedExercises);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async (exercise) => {
    try {
      const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...exercise, teacherId: user._id }),
      });

      if (response.ok && selectedFolder) {
        await fetchExercisesForFolder(selectedFolder._id);
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const deleteExercise = async (id) => {
    setExercises((prev) => prev.filter((ex) => ex._id !== id));
    try {
      const response = await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete exercise on server');
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      if (selectedFolder) fetchExercisesForFolder(selectedFolder._id);
    }
  };

  const handleRenameExercise = async (exerciseId, newName) => {
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
      const response = await fetch(`${API_URL}/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctAnswer: newName }),
      });
      if (!response.ok) throw new Error('Failed to rename exercise on server');
    } catch (error) {
      console.error('Failed to rename exercise:', error);
      if (selectedFolder) fetchExercisesForFolder(selectedFolder._id);
    }
  };

  return (
    <>
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