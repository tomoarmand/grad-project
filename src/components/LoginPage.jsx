import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import NavLinks from './NavLinks';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [teacherAccessCode, setTeacherAccessCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useUserStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  const validateEmail = (email) => {
    const sanitized = sanitizeInput(email);
    if (!sanitized) {
      return { isValid: false, message: 'Email is required' };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    if (sanitized.length > 100) {
      return { isValid: false, message: 'Email must be 100 characters or less' };
    }
    return { isValid: true, sanitized };
  };

  const validateAccessCode = (code) => {
    const sanitized = sanitizeInput(code);
    if (!sanitized) {
      return { isValid: false, message: 'Access code is required for teachers' };
    }
    if (sanitized.length < 4 || sanitized.length > 10) {
      return { isValid: false, message: 'Access code must be 4-10 characters' };
    }
    const codeRegex = /^[a-zA-Z0-9]+$/;
    if (!codeRegex.test(sanitized)) {
      return { isValid: false, message: 'Access code can only contain letters and numbers' };
    }
    return { isValid: true, sanitized };
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    if (value.length <= 100) {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    if (e.target.value === 'student') {
      setTeacherAccessCode('');
      if (errors.accessCode) setErrors(prev => ({ ...prev, accessCode: '' }));
    }
  };

  const handleAccessCodeChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setTeacherAccessCode(value);
      if (errors.accessCode) setErrors(prev => ({ ...prev, accessCode: '' }));
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const newErrors = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    }

    let accessCodeValidation = null;
    if (role === 'teacher') {
      accessCodeValidation = validateAccessCode(teacherAccessCode);
      if (!accessCodeValidation.isValid) {
        newErrors.accessCode = accessCodeValidation.message;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const loginData = { email: emailValidation.sanitized };

      // Include accessCode for teachers, using sanitized version
      if (role === 'teacher') {
        loginData.accessCode = accessCodeValidation.sanitized;
        // DEBUG LOGGING
        console.log('🐛 Frontend: Sending teacher login with access code:', loginData.accessCode);
        console.log('🐛 Frontend: Raw access code was:', teacherAccessCode);
        console.log('🐛 Frontend: Full login data:', loginData);
      }

      console.log('🐛 Frontend: Making login request to:', `${API_URL}/users/login`);
      console.log('🐛 Frontend: Login data being sent:', loginData);

      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(loginData),
      });

      console.log('🐛 Frontend: Response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('🐛 Frontend: Login successful, user data:', userData);

        if (!userData || !userData.role || !userData._id) {
          setErrors({ general: 'Invalid response from server' });
          return;
        }

        // Store JWT token
        if (userData.token) {
          setToken(userData.token);
          localStorage.setItem('authToken', userData.token);
        }

        // Create sanitized user object without token
        const sanitizedUser = {
          _id: userData._id,
          fullName: sanitizeInput(userData.fullName || ''),
          email: sanitizeInput(userData.email || ''),
          role: userData.role === 'teacher' || userData.role === 'student' ? userData.role : null,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };

        if (!sanitizedUser.role) {
          setErrors({ general: 'Invalid user role' });
          return;
        }

        setUser(sanitizedUser);
        if (sanitizedUser.role === 'teacher') {
          navigate('/TeacherPage');
        } else if (sanitizedUser.role === 'student') {
          navigate('/StudentPage');
        }

      } else {
        const errorResponse = await response.json();
        console.log('🐛 Frontend: Login failed, error response:', errorResponse);
        const errorMessage = sanitizeInput(errorResponse.error || "Login failed");
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('🐛 Frontend: Login error:', error);
      setErrors({ general: "An error occurred while logging in. Please check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-6 sm:p-8 mt-4">
        <h1 className="text-3xl sm:text-4xl text-white font-bold text-center mb-6">Welcome Back</h1>

        {errors.general && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">
            {errors.general}
          </div>
        )}

        {/* DEBUG INFO */}
        {role === 'teacher' && (
          <div className="bg-blue-500 text-white p-2 rounded mb-4 text-xs">
            DEBUG: Access Code = "{teacherAccessCode}"
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Role selector - no label */}
          <div>
            <select
              name="role"
              value={role}
              onChange={handleRoleChange}
              className="w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black border-2 border-gray-300 focus:outline-none focus:border-orange-400 transition"
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Email input */}
          <div>
            <input
              className={`w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border transition ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]'
                  : 'border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
              }`}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={isLoading}
              maxLength="100"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Access code input - only visible for teachers */}
          {role === 'teacher' && (
            <div>
              <input
                className={`w-full px-4 py-3 text-base sm:text-lg rounded bg-[#f8fafc] text-black placeholder-gray-500 border transition ${
                  errors.accessCode
                    ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68),0_0_6px_rgb(239,68,68)]'
                    : 'border-gray-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500'
                }`}
                type="password"
                placeholder="Enter Teacher Access Code"
                value={teacherAccessCode}
                onChange={handleAccessCodeChange}
                disabled={isLoading}
                maxLength="10"
                autoComplete="current-password"
              />
              {errors.accessCode && <p className="text-red-400 text-sm mt-1">{errors.accessCode}</p>}
              <p className="text-slate-300 text-xs mt-1">
                Teachers must enter the access code to log in.
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className={`w-full py-3 rounded text-lg sm:text-xl font-semibold transition duration-200 ${
              isLoading || !email.trim()
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-[#64748b] hover:bg-[#fb923c] text-white'
            }`}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>

      <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isSubtle />
    </div>
  );
}

export default LoginPage;