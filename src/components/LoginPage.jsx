import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';

function LoginPage() {
    const [email, setEmail] = useState('');
    const { setUser } = useUserStore();
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

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
                navigate('/TeacherPage');
            } else if (user.role === 'student') {
                navigate('/StudentPage');
            }
            } else {
                const error = await response.json();
                alert(error.error || "Login failed");
            }
        };

        return (
            <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 p-4 text-white">
      <input
        name="email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="text-black"
        required
      />
      <button className="bg-[#64748b] hover:bg-[#fb923c] px-4 py-2 rounded">
        Log In
      </button>
    </form>
        )
}

export default LoginPage;