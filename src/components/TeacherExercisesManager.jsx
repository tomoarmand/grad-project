import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import useUserStore from '../store/userStore';
import { PuffLoader } from "react-spinners";


function TeacherExercisesManager() {

    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore(); // teacher
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchStudents = async () => {
            const res = await fetch(`${API_URL}/assignments/students/by-teacher/${user._id}`);
            const data = await res.json();
            setStudents(data);
        };
        if (user) fetchStudents();
    }, [user]);


    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setLoading(true);

        const res = await fetch(`${API_URL}/exercises?studentId=${student._id}&userId=${user._id}`);
        const data = await res.json();
        setExercises(data);
        setLoading(false);
    }

    const handleUnassign = async (exerciseId) => {
        const res = await fetch(`${API_URL}/assignments/unassign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                exerciseId,
                studentId: selectedStudent._id,
            })
        })

        if (res.ok) {
            handleSelectStudent(selectedStudent)
        }
    }



    return (
        <>
            <select
                onChange={(e) => {
                    const student = students.find(s => s._id === e.target.value);
                    handleSelectStudent(student);
                }}
                className="bg-slate-700 text-white rounded p-2"
            >
                <option value="">Select a student</option>
                {students.map(student => (
                    <option key={student._id} value={student._id}>
                        {student.fullName}
                    </option>
                ))}
            </select>

            <ul>
                {exercises.map(ex => (
                    <li key={ex._id} className="bg-slate-600 p-4 rounded mb-2">
                        <p className="text-white">Correct Answer: {ex.correctAnswer}</p>
                        <audio controls src={ex.audioData}></audio>
                        <div className="flex gap-4 mt-2">
                            <button onClick={() => handleUnassign(ex._id)} className="text-yellow-300">Unassign</button>
                            <button onClick={() => handleDelete(ex._id)} className="text-red-400">Delete</button>
                            <button onClick={() => handleEdit(ex)} className="text-blue-300">Edit</button>
                        </div>
                    </li>
                ))}
            </ul>
            
        </>
    )
    
}

export default TeacherExercisesManager