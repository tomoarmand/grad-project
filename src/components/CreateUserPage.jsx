import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateUserPage() {
    const [formData, setFormData] = useState({ fullName: '', email: '', role: 'teacher' });
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const handleChange =  (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value })
    };

    const handleSubmit = async event => {
        event.preventDefault();
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const user = await response.json();
            alert (`${user.role} account created!`);
            navigate('/');
        } else {
            const error = await response.json();
            alert(error.error || "Error creating user");
        }
    };

    return (
        <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-6 bg-[#475569] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-4 text-white">
      <input name="fullName" placeholder="Full Name" onChange={handleChange} className="text-m sm:text-l md:text-xl  text-bl bg-[#f8fafc] pl-3 h-11 rounded-sm placeholder-gray-500" required />
      <input name="email" placeholder="Email" onChange={handleChange} className="text-m sm:text-l md:text-xl  text-bl bg-[#f8fafc] pl-3 h-11 rounded-sm placeholder-gray-500" required />
      <select name="role" onChange={handleChange} value={formData.role} className="text-m sm:text-l md:text-xl  text-black bg-[#f8fafc] pl-3 h-10 rounded-sm placeholder-gray-500 px-1">
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </select>
      <button className="text-lg sm:text-xl md:text-2xl border-none rounded px-4 py-2 text-center inline-block text-[#f8fafc] bg-[#64748b] hover:bg-[#fb923c]">Create Account</button>
      <Link to="/"><p className="font-bold text-base sm:text-l md:text-xl mb-1 sm:mb-2 mt-20 text-[#f8fafc]">Home Page</p></Link>
    </form>
    </div>
    )
}



export default CreateUserPage;