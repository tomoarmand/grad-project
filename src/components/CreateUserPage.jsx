import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import NavLinks from './NavLinks';

function CreateUserPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'teacher' });
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const user = await response.json();

        if (user.role === 'teacher') {
          // Teachers still get auto-logged in
          setUser(user);
          // Uncomment to re-enable PIN verification
          // if (teacherPIN === TEACHER_KEY) {
            navigate('/TeacherPage');
          // } else {
          //   alert("Account created, but incorrect PIN. Please log in again.");
          //   navigate('/');
          // }
        } else if (user.role === 'student') {
          // Students are NOT auto-logged in - redirect to home page with alert
          alert('Student account created successfully!');
          navigate('/');
        }
      } else {
        const error = await response.json();
        alert(error.error || "Error creating user");
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert("An error occurred while creating the account. Please try again.");
    } finally {
      setIsLoading(false);
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
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
            required
            disabled={isLoading}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
            required
            disabled={isLoading}
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black border-2 border-gray-300 focus:outline-none focus:border-orange-400 transition"
            disabled={isLoading}
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
              className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
              disabled={isLoading}
            />
          )}
          */}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-lg sm:text-xl font-semibold transition duration-200 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-[#64748b] hover:bg-[#fb923c] text-white'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isSubtle />
    </div>
  );
}

export default CreateUserPage;