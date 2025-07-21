import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import NavLinks from './NavLinks';

function LoginPage() {
  const [email, setEmail] = useState('');
  // const [teacherPIN, setTeacherPIN] = useState('');
  const { setUser } = useUserStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  // const TEACHER_KEY = "0000";

  const handleLogin = async (event) => {
    event.preventDefault();

    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const user = await response.json();
      setUser(user);

      if (user.role === 'teacher') {
        // Uncomment below to enable PIN check for teachers
        // if (teacherPIN === TEACHER_KEY) {
          navigate('/TeacherPage');
        // } else {
        //   alert("Incorrect PIN");
        // }
      } else if (user.role === 'student') {
        navigate('/StudentPage');
      }
    } else {
      const error = await response.json();
      alert(error.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 mt-4">
        <h1 className="text-3xl sm:text-4xl text-white font-bold text-center mb-6">Welcome Back</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {/*
          <input
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(251,146,60,0.8),0_0_10px_rgba(251,146,60,0.4)] focus:border-transparent transition"
            type="text"
            placeholder="Enter PIN (Teachers only)"
            value={teacherPIN}
            onChange={(e) => setTeacherPIN(e.target.value)}
          />
          */}
          <button
            type="submit"
            className="w-full bg-[#64748b] hover:bg-[#fb923c] text-white py-3 rounded text-lg sm:text-xl font-semibold transition duration-200"
          >
            Log In
          </button>
        </form>
      </div>
      <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isSubtle />
    </div>
  );
}

export default LoginPage;