import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/userStore';

function AuthWrapper({ children }) {
  const { 
    user, 
    isAuthenticated, 
    verifyToken, 
    initializeAuth, 
    clearUser 
  } = useUserStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 AuthWrapper: Starting auth check...');
      try {
        // First, try to get token from localStorage
        const storedToken = localStorage.getItem('authToken');
        console.log('🔍 AuthWrapper: Stored token exists?', !!storedToken);
        
        if (storedToken) {
          console.log('🔍 AuthWrapper: Initializing auth with stored token...');
          // Initialize the store with the token
          initializeAuth();
          
          console.log('🔍 AuthWrapper: Verifying token with backend...');
          // Verify token is still valid with backend
          const isValid = await verifyToken();
          console.log('🔍 AuthWrapper: Token verification result:', isValid);
          
          // Only clear auth if token verification explicitly failed with 401/403
          // Don't clear on network errors - keep user logged in
          if (isValid === false) {
            console.log('🔍 AuthWrapper: Token verification failed (server rejected), clearing auth');
            clearUser();
            localStorage.removeItem('authToken');
          } else if (isValid === true) {
            console.log('🔍 AuthWrapper: User authenticated from stored token');
          } else {
            // Network error or server down - keep user logged in but show they might need to reconnect
            console.log('🔍 AuthWrapper: Network error during verification, keeping user logged in');
          }
        } else {
          console.log('🔍 AuthWrapper: No stored token found');
          // No token found, ensure user state is clear
          clearUser();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        // On error, clear auth state to be safe
        clearUser();
        localStorage.removeItem('authToken');
      } finally {
        setAuthChecked(true);
        setIsLoading(false);
      }
    };

    // Only run auth check once on app startup
    if (!authChecked) {
      checkAuthStatus();
    }
  }, [authChecked, initializeAuth, verifyToken, clearUser]);

  // Handle redirects after authentication is checked
  useEffect(() => {
    if (!isLoading && authChecked) {
      const currentPath = location.pathname;
      
      // If user is authenticated and on auth pages, redirect to their dashboard
      if (isAuthenticated && (currentPath === '/LoginPage' || currentPath === '/CreateUserPage')) {
        if (user?.role === 'teacher') {
          navigate('/TeacherPage', { replace: true });
        } else if (user?.role === 'student') {
          navigate('/StudentPage', { replace: true });
        }
      }
      
      // Only redirect to login if user is definitely not authenticated AND on protected pages
      // Don't redirect during the verification process
      const protectedPaths = ['/TeacherPage', '/StudentPage', '/AssignmentPage', '/TeacherExercisesManager'];
      if (!isAuthenticated && protectedPaths.includes(currentPath) && authChecked) {
        console.log('🔍 AuthWrapper: Redirecting to login - not authenticated on protected page');
        navigate('/LoginPage', { replace: true });
      }
      
      // Additional role-based protection - but only if user is definitely authenticated
      if (isAuthenticated && user) {
        if (currentPath === '/TeacherPage' && user.role !== 'teacher') {
          navigate('/StudentPage', { replace: true });
        }
        if (currentPath === '/StudentPage' && user.role !== 'student') {
          navigate('/TeacherPage', { replace: true });
        }
        if ((currentPath === '/TeacherExercisesManager') && user.role !== 'teacher') {
          navigate('/LoginPage', { replace: true });
        }
      }
    }
  }, [isLoading, authChecked, isAuthenticated, user, location.pathname, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return children;
}

export default AuthWrapper;