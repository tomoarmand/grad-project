import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react'

function TeacherPage() {
    const [exercises, setExercises] = useState([]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("exercises") || "[]");
        setExercises(stored);
    }, []);

    const addExercise = (exercise) => {
        const updatedExercises = [...exercises, exercise];
        setExercises(updatedExercises);
        localStorage.setItem("exercises", JSON.stringify(updatedExercises))
    }

    const deleteExercise = (id) => {
        const updatedExercises = exercises.filter((ex) => ex.id !==id);
        setExercises(updatedExercises);
        localStorage.setItem("exercises", JSON.stringify(updatedExercises))
    }
    return (
        <>
        <h1>Teacher Page</h1>
        <ExerciseList exercises={exercises} onDelete={deleteExercise}/>
        <RecordingComponent onSave={addExercise} />
        <Link to="/">Home Page</Link>
        </>
    )
}

export default TeacherPage