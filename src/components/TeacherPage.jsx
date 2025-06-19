import { Link } from 'react-router-dom';
import RecordingComponent from './RecordingComponent';
import ExerciseList from './ExerciseList';
import { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';

function TeacherPage() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const { user } = useUserStore();

    const API_URL = import.meta.env.VITE_API_URL;
    // ^
    //  || "http://localhost:3000"

    const fetchStudents = async () => {
        const response = await fetch(`${API_URL}/users`);
        const allUsers = await response.json();
        const studentUsers = allUsers.filter(user => user.role === 'student');
        setStudents(studentUsers);
        console.log(studentUsers)
    }

    const fetchExercises = async (studentId) => {
        if (!user) return; // protect against null

        setLoading(true);
        const response = await fetch(`${API_URL}/exercises?userId=${user._id}&studentId=${studentId}`);
        const stored = await response.json();
        setExercises(stored);
        setLoading(false);
    }

    useEffect(() => {
        if (user) {
            fetchStudents();
        }
    }, [user]);

    const addExercise = async (exercise) => {

        const exerciseWithTeacherAndStudent = {
            ...exercise,
            userId: user._id,
            studentId: exercise.studentId,
        };
        const response = await fetch(`${API_URL}/exercises`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(exerciseWithTeacherAndStudent)
        })

        const data = await response.json();
        exerciseWithTeacherAndStudent._id = data._id;

        const updatedExercises = [...exercises, exerciseWithTeacherAndStudent];
        setExercises(updatedExercises);
    }

    const deleteExercise = async (id) => {
        console.log(id)
        const response = await fetch(`${API_URL}/exercises/${id}?userId=${user._id}`, {
            method: "DELETE",
        })

        const remainingExercises = await response.json();
        setExercises(remainingExercises);

    }

    const handleStudentSelection = (event) => {
        setSelectedStudentId(event.target.value);
        const studentId = event.target.value;
        fetchExercises(studentId);
        console.log(studentId)
    }

    if (!user) {
        return (
            <div className="min-h-screen w-screen flex justify-center items-center bg-[#475569] text-white">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden">
            <select
                className="text-m text-center sm:text-l md:text-xl  text-bl bg-[#f8fafc] rounded-sm h-11 px-1"
                value={selectedStudentId}
                onChange={(e) => {
                    const studentId = e.target.value;
                    setSelectedStudentId(studentId);
                    fetchExercises(studentId);
                }}
            >
                <option value="">Select Student</option>
                {students.map((student) => (
                    <option key={student._id} value={student._id}>{student.fullName}</option>
                ))}
            </select>
            <ExerciseList exercises={exercises} onDelete={deleteExercise} loading={loading} />
            <RecordingComponent onSave={addExercise} students={students} teacherId={user._id} selectedStudentId={selectedStudentId} />
            <Link to="/"><p className="font-bold text-base sm:text-l md:text-xl mb-1 sm:mb-2 mt-20 text-[#f8fafc]">Home Page</p></Link>
        </div>
    )
}

export default TeacherPage