import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore';

function AuthWrapper({ children }) {
  const { user, isAuthenticated, verifyToken, initializeAuth, clearUser } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
          initializeAuth();
          const isValid = await verifyToken();

          if (isValid === false) {
            clearUser();
            localStorage.removeItem('authToken');
          }
        } else {
          clearUser();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        clearUser();
        localStorage.removeItem('authToken');
      } finally {
        setAuthChecked(true);
        setIsLoading(false);
      }
    };

    if (!authChecked) {
      checkAuthStatus();
    }
  }, [authChecked, initializeAuth, verifyToken, clearUser]);

  useEffect(() => {
    if (!isLoading && authChecked) {
      const path = location.pathname;

      // Redirect authenticated users away from auth pages
      if (isAuthenticated && (path === '/LoginPage' || path === '/CreateUserPage')) {
        if (user?.role === 'teacher') navigate('/TeacherPage', { replace: true });
        else if (user?.role === 'student') navigate('/StudentPage', { replace: true });
      }

      // Redirect unauthenticated users from protected pages
      const protectedPaths = ['/TeacherPage', '/StudentPage', '/AssignmentPage', '/TeacherExercisesManager'];
      if (!isAuthenticated && protectedPaths.includes(path)) {
        navigate('/LoginPage', { replace: true });
      }

      // Role-based protection
      if (isAuthenticated && user) {
        if (path === '/TeacherPage' && user.role !== 'teacher') navigate('/StudentPage', { replace: true });
        if (path === '/StudentPage' && user.role !== 'student') navigate('/TeacherPage', { replace: true });
        if (path === '/TeacherExercisesManager' && user.role !== 'teacher') navigate('/LoginPage', { replace: true });
      }
    }
  }, [isLoading, authChecked, isAuthenticated, user, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900">
        <div className="flex flex-col items-center gap-4">
          <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return children;
}

export default AuthWrapper;
