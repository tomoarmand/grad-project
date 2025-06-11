import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react'

function TeacherPage() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    // ^
    //  || "http://localhost:3000"

    const fetchExercises = async () => {
        setLoading(true);
        const response = await fetch(`${API_URL}/exercises`);
        const stored = await response.json();
        setExercises(stored);
        setLoading(false);
    }

    useEffect(() => {
        fetchExercises();
    }, []);

    const addExercise = async (exercise) => {
        const response = await fetch(`${API_URL}/exercises`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(exercise)
        })
        const data = await response.json();
        exercise._id = data._id;

        const updatedExercises = [...exercises, exercise];
        setExercises(updatedExercises);
    }

    const deleteExercise = async (id) => {
        console.log(id)
        const response = await fetch(`${API_URL}/exercises/${id}`, {
            method: "DELETE",
        })

        const remainingExercises = await response.json();
        setExercises(remainingExercises);

    }
    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden">
        <ExerciseList exercises={exercises} onDelete={deleteExercise} loading={loading}/>
        <RecordingComponent onSave={addExercise} />
        <Link to="/"><p className="font-bold text-base sm:text-l md:text-xl mb-1 sm:mb-2 mt-20 text-[#f8fafc]">Home Page</p></Link>
        </div>
    )
}

export default TeacherPage