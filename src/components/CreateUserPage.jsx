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

      if (formData.role === 'student') {
        sanitizedData.password = formData.password;
      }

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
        if (user.token) {
          localStorage.setItem('authToken', user.token);
        }
        setUser(user);

        if (user.role === 'teacher') {
          navigate('/TeacherPage');
        } else {
          navigate('/subscribe');
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

  const inputBase = 'w-full px-4 py-3 text-base sm:text-lg rounded bg-gray-50 text-gray-900 placeholder-gray-400 border transition focus:outline-none';
  const inputNormal = `${inputBase} border-gray-200 focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)]`;
  const inputError = `${inputBase} border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68)]`;

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 px-4 py-6">
      <div className="w-full max-w-sm bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-heading uppercase tracking-wide text-white text-center mb-6">
          Create Account
        </h1>

        {errors.general && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm font-body">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? inputError : inputNormal}
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm font-body mt-2">{errors.role}</p>}
          </div>

          <div>
            <input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? inputError : inputNormal}
              required
              disabled={isLoading}
              maxLength="50"
              autoComplete="name"
            />
            {errors.fullName && <p className="text-red-500 text-sm font-body mt-2">{errors.fullName}</p>}
          </div>

          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? inputError : inputNormal}
              required
              disabled={isLoading}
              maxLength="100"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-500 text-sm font-body mt-2">{errors.email}</p>}
          </div>

          {formData.role === 'student' && (
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? inputError : inputNormal}
                disabled={isLoading}
                maxLength="100"
                autoComplete="new-password"
                required
              />
              {errors.password && <p className="text-red-500 text-sm font-body mt-2">{errors.password}</p>}
            </div>
          )}

          {formData.role === 'teacher' && (
            <div>
              <input
                type="password"
                placeholder="Access Code"
                value={teacherAccessCode}
                onChange={handleAccessCodeChange}
                className={errors.accessCode ? inputError : inputNormal}
                disabled={isLoading}
                maxLength="10"
                autoComplete="new-password"
              />
              {errors.accessCode && <p className="text-red-500 text-sm font-body mt-2">{errors.accessCode}</p>}
              <p className="text-gray-400 text-xs font-body mt-2">
                Teachers must enter the access code.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-lg font-heading uppercase tracking-wide shadow-lg transition duration-200 ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-red-600 hover:bg-red-700 text-white'
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