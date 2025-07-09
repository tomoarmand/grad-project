import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import NavLinks from './NavLinks';

function CreateUserPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'teacher' });
  // const [teacherPIN, setTeacherPIN] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  // const TEACHER_KEY = "0000";

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const user = await response.json();
      setUser(user);

      if (user.role === 'teacher') {
        // Uncomment to re-enable PIN verification
        // if (teacherPIN === TEACHER_KEY) {
          navigate('/TeacherPage');
        // } else {
        //   alert("Account created, but incorrect PIN. Please log in again.");
        //   navigate('/');
        // }
      } else if (user.role === 'student') {
        navigate('/StudentPage');
      }
    } else {
      const error = await response.json();
      alert(error.error || "Error creating user");
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 mt-4">
        <h1 className="text-3xl sm:text-4xl text-white font-bold text-center mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          {/* 
          {formData.role === 'teacher' && (
            <input
              type="text"
              placeholder="Enter PIN (Teachers only)"
              value={teacherPIN}
              onChange={(e) => setTeacherPIN(e.target.value)}
              className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
          )}
          */}

          <button
            type="submit"
            className="w-full bg-[#64748b] hover:bg-[#fb923c] text-white py-3 rounded text-lg sm:text-xl font-semibold transition duration-200"
          >
            Create Account
          </button>
        </form>
      </div>

      <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isSubtle />
    </div>
  );
}

export default CreateUserPage;