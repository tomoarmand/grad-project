import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import NavLinks from './NavLinks';

function CreateUserPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'student' });
  const [isLoading, setIsLoading] = useState(false);
  const [teacherAccessCode, setTeacherAccessCode] = useState('');
  const [errors, setErrors] = useState({});
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  const validateFullName = (name) => /^[a-zA-Z\s\-']{2,50}$/.test(name);
  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  
  const validatePassword = (password) => {
    if (!password) return { isValid: false, message: 'Password is required' };
    if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters' };
    return { isValid: true, sanitized: password };
  };

  const validateForm = () => {
    const newErrors = {};
    
    const sanitizedName = sanitizeInput(formData.fullName);
    if (!sanitizedName) newErrors.fullName = 'Full name is required';
    else if (!validateFullName(sanitizedName))
      newErrors.fullName = 'Full name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes';

    const sanitizedEmail = sanitizeInput(formData.email);
    if (!sanitizedEmail) newErrors.email = 'Email is required';
    else if (!validateEmail(sanitizedEmail)) newErrors.email = 'Please enter a valid email address';

    const validRoles = ['teacher', 'student'];
    if (!validRoles.includes(formData.role)) newErrors.role = 'Please select a valid role';

    // Validate based on role
    if (formData.role === 'student') {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    } else if (formData.role === 'teacher') {
      if (!teacherAccessCode.trim()) {
        newErrors.accessCode = 'Teacher access code is required';
      } else if (!/^[a-zA-Z0-9]{4,10}$/.test(teacherAccessCode.trim())) {
        newErrors.accessCode = 'Access code must be 4-10 alphanumeric characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));

    let sanitizedValue = value;
    if (name === 'fullName' && value.length > 50) sanitizedValue = value.slice(0, 50);
    if (name === 'email' && value.length > 100) sanitizedValue = value.slice(0, 100);
    if (name === 'password' && value.length > 100) sanitizedValue = value.slice(0, 100);

    setFormData({ ...formData, [name]: sanitizedValue });

    if (name === 'role' && value === 'student' && errors.accessCode) {
      setErrors((prev) => ({ ...prev, accessCode: '' }));
      setTeacherAccessCode('');
    }
  };

  const handleAccessCodeChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setTeacherAccessCode(value);
      if (errors.accessCode) setErrors((prev) => ({ ...prev, accessCode: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const sanitizedData = {
        fullName: sanitizeInput(formData.fullName),
        email: sanitizeInput(formData.email).toLowerCase(),
        role: formData.role,
      };

      // Add password only for students
      if (formData.role === 'student') {
        sanitizedData.password = formData.password;
      }

      // Add access code only for teachers
      if (formData.role === 'teacher') {
        sanitizedData.accessCode = teacherAccessCode.trim();
      }

      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (response.ok) {
        const user = await response.json();
        setUser(user);

        // Auto-login & redirect based on role
        if (user.role === 'teacher') {
          navigate('/TeacherPage');
        } else {
          navigate('/StudentPage');
        }
      } else {
        const error = await response.json();
        setErrors({ general: error.error || 'Error creating user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ general: 'An error occurred while creating the account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 py-6">
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl text-white font-bold text-center mb-6">Create Account</h1>

        {errors.general && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Role selector */}
          <div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base rounded bg-[#f8fafc] text-black border-2 transition focus:outline-none ${
                errors.role ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-400'
              }`}
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {errors.role && <p className="text-red-400 text-sm mt-2">{errors.role}</p>}
          </div>

          {/* Full name input */}
          <div>
            <input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base rounded bg-[#f8fafc] text-black placeholder-gray-500 border-2 transition focus:outline-none ${
                errors.fullName
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]'
                  : 'border-gray-300 focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
              }`}
              required
              disabled={isLoading}
              maxLength="50"
              autoComplete="name"
            />
            {errors.fullName && <p className="text-red-400 text-sm mt-2">{errors.fullName}</p>}
          </div>

          {/* Email input */}
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base rounded bg-[#f8fafc] text-black placeholder-gray-500 border-2 transition focus:outline-none ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]'
                  : 'border-gray-300 focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
              }`}
              required
              disabled={isLoading}
              maxLength="100"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
          </div>

          {/* Password input - only for students */}
          {formData.role === 'student' && (
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 text-base rounded bg-[#f8fafc] text-black placeholder-gray-500 border-2 transition focus:outline-none ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]'
                    : 'border-gray-300 focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
                }`}
                disabled={isLoading}
                maxLength="100"
                autoComplete="new-password"
                required
              />
              {errors.password && <p className="text-red-400 text-sm mt-2">{errors.password}</p>}
            </div>
          )}

          {/* Access code input - only for teachers */}
          {formData.role === 'teacher' && (
            <div>
              <input
                type="password"
                placeholder="Access Code"
                value={teacherAccessCode}
                onChange={handleAccessCodeChange}
                className={`w-full px-4 py-3 text-base rounded bg-[#f8fafc] text-black placeholder-gray-500 border-2 transition focus:outline-none ${
                  errors.accessCode
                    ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]'
                    : 'border-gray-300 focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
                }`}
                disabled={isLoading}
                maxLength="10"
                autoComplete="new-password"
              />
              {errors.accessCode && <p className="text-red-400 text-sm mt-2">{errors.accessCode}</p>}
              <p className="text-slate-300 text-xs mt-2">
                Teachers must enter the access code.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-lg font-semibold transition duration-200 ${
              isLoading ? 'bg-gray-400 cursor-not-allowed text-gray-600' : 'bg-[#64748b] hover:bg-[#fb923c] text-white'
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