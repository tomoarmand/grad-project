import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import NavLinks from './NavLinks';

function CreateUserPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'student' }); // Default to student
  const [isLoading, setIsLoading] = useState(false);
  const [teacherPIN, setTeacherPIN] = useState('');
  const [errors, setErrors] = useState({});
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  // You can define or import these validation functions as needed:
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  const validateFullName = (name) => {
    // Must be 2-50 chars, only letters, spaces, hyphens, apostrophes
    return /^[a-zA-Z\s\-']{2,50}$/.test(name);
  };

  const validateEmail = (email) => {
    // Basic email regex
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const validatePIN = (pin) => {
    const sanitized = sanitizeInput(pin);
    if (!sanitized) {
      return { isValid: false, message: 'PIN is required for teachers' };
    }
    if (sanitized.length < 4 || sanitized.length > 10) {
      return { isValid: false, message: 'PIN must be 4-10 characters' };
    }
    const pinRegex = /^[a-zA-Z0-9]+$/;
    if (!pinRegex.test(sanitized)) {
      return { isValid: false, message: 'PIN can only contain letters and numbers' };
    }
    return { isValid: true, sanitized };
  };

  const validateForm = () => {
    const newErrors = {};
    const sanitizedName = sanitizeInput(formData.fullName);
    if (!sanitizedName) newErrors.fullName = 'Full name is required';
    else if (!validateFullName(sanitizedName)) newErrors.fullName = 'Full name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes';

    const sanitizedEmail = sanitizeInput(formData.email);
    if (!sanitizedEmail) newErrors.email = 'Email is required';
    else if (!validateEmail(sanitizedEmail)) newErrors.email = 'Please enter a valid email address';

    const validRoles = ['teacher', 'student'];
    if (!validRoles.includes(formData.role)) newErrors.role = 'Please select a valid role';

    if (formData.role === 'teacher') {
      const pinValidation = validatePIN(teacherPIN);
      if (!pinValidation.isValid) newErrors.pin = pinValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    let sanitizedValue = value;
    if (name === 'fullName' && value.length > 50) sanitizedValue = value.slice(0, 50);
    if (name === 'email' && value.length > 100) sanitizedValue = value.slice(0, 100);

    setFormData({ ...formData, [name]: sanitizedValue });

    // Clear PIN error if role changes to student
    if (name === 'role' && value === 'student' && errors.pin) {
      setErrors(prev => ({ ...prev, pin: '' }));
      setTeacherPIN('');
    }
  };

  const handlePINChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setTeacherPIN(value);
      if (errors.pin) setErrors(prev => ({ ...prev, pin: '' }));
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
        pin: formData.role === 'teacher' ? teacherPIN : undefined,
      };

      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      });

      if (response.ok) {
        const user = await response.json();
        if (user.role === 'teacher') {
          alert('Teacher account created successfully! Please log in with your PIN.');
        } else {
          alert('Student account created successfully! Please log in.');
        }
        navigate('/');
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 mt-4">
        <h1 className="text-3xl sm:text-4xl text-white font-bold text-center mb-6">Create Account</h1>

        {errors.general && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* fullName input */}
          <div>
            <input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border transition ${
                errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:border-orange-500'
              }`}
              required
              disabled={isLoading}
              maxLength="50"
            />
            {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* email input */}
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border transition ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:border-orange-500'
              }`}
              required
              disabled={isLoading}
              maxLength="100"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* role select */}
          <div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black border-2 transition ${
                errors.role ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:border-orange-400'
              }`}
              disabled={isLoading}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
          </div>

          {/* PIN input only for teachers */}
          {formData.role === 'teacher' && (
            <div>
              <input
                type="password"
                placeholder="Enter PIN (Teachers only)"
                value={teacherPIN}
                onChange={handlePINChange}
                className={`w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border transition ${
                  errors.pin ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:border-orange-500'
                }`}
                disabled={isLoading}
                maxLength="10"
                autoComplete="new-password"
              />
              {errors.pin && <p className="text-red-400 text-sm mt-1">{errors.pin}</p>}
              <p className="text-slate-300 text-xs mt-1">Your PIN will be securely encrypted and stored</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-lg sm:text-xl font-semibold transition duration-200 ${
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