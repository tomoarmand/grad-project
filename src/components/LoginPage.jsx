import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { Link } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('');
    const { setUser } = useUserStore();
    const API_URL = import.meta.env.VITE_API_URL;
    const TEACHER_KEY = "0000";
    const navigate = useNavigate();
    const [teacherPIN, setTeacherPIN] = useState();

    const handleLogin = async (event) => {
        event.preventDefault();

        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            const user = await response.json();
            setUser(user); // Store in Zustand

            // Redirect based on role
            if (user.role === 'teacher') {
                console.log(teacherPIN)
                console.log(TEACHER_KEY)
                if (teacherPIN === TEACHER_KEY) {
                navigate('/TeacherPage')
            } else {
                alert("Incorrect PIN")
            }
            } else if (user.role === 'student') {
                navigate('/StudentPage');
            }
        } else {
            const error = await response.json();
            alert(error.error || "Login failed");
        }
    };

    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden">
            <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 p-4">
                <input
                    className="text-m text-center sm:text-l md:text-xl  text-bl bg-[#f8fafc] h-10 placeholder-gray-500"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
                <input 
                value={teacherPIN}
                onChange={(event) => setTeacherPIN(event.target.value)}
                placeholder="Enter PIN (Teachers only)"
                />
                <button className="bg-[#64748b] hover:bg-[#fb923c] text-white px-4 py-2 rounded">
                    Log In
                </button>
            </form>
            <Link to="/"><p className="font-bold text-base sm:text-l md:text-xl mb-1 sm:mb-2 mt-20 text-[#f8fafc]">Home Page</p></Link>
        </div>
    )
}


export default LoginPage;