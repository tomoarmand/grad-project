import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react'

function TeacherPage() {
    const [exercises, setExercises] = useState([]);

    const fetchExercises = async () => {
        const response = await fetch("http://localhost:3000/exercises");
        const stored = await response.json();
        setExercises(stored);
    }

    useEffect(() => {
        fetchExercises();
    }, []);

    const addExercise = async (exercise) => {
        const response = await fetch("http://localhost:3000/exercises", {
            method: "POST",
            body: JSON.stringify(exercise)
        })
        const data = await response.json();
        exercise._id = data._id;

        const updatedExercises = [...exercises, exercise];
        setExercises(updatedExercises);
    }

    const deleteExercise = async (id) => {
        console.log(id)
        const response = await fetch(`http://localhost:3000/exercises/${id}`, {
            method: "DELETE",
        })

        const remainingExercises = await response.json();
        setExercises(remainingExercises);

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