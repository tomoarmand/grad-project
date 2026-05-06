import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PuffLoader } from 'react-spinners';
import useUserStore from '../store/userStore';

const API_URL = import.meta.env.VITE_API_URL;

function AuthWrapper({ children }) {
  const { user, isAuthenticated, verifyToken, initializeAuth, clearUser } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const checkSubscription = async () => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      setSubscriptionChecked(true);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/stripe/subscription-status`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      const data = await res.json();
      setSubscriptionStatus(data.subscriptionStatus);
    } catch (err) {
      console.error('Subscription check failed:', err);
      setSubscriptionStatus('inactive');
    } finally {
      setSubscriptionChecked(true);
    }
  };

  // Reset auth check when token changes
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token && authChecked) {
      setAuthChecked(false);
      setSubscriptionStatus(null);
      setSubscriptionChecked(false);
    } else if (token && authChecked && !isAuthenticated) {
      setAuthChecked(false);
    }
  }, [location.pathname]);

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
            setSubscriptionChecked(true);
          } else {
            await checkSubscription();
          }
        } else {
          clearUser();
          setSubscriptionStatus(null);
          setSubscriptionChecked(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        clearUser();
        localStorage.removeItem('authToken');
        setSubscriptionChecked(true);
      } finally {
        setAuthChecked(true);
        setIsLoading(false);
      }
    };

    if (!authChecked) {
      checkAuthStatus();
    }
  }, [authChecked, initializeAuth, verifyToken, clearUser]);

  // Re-check subscription every time user navigates to StudentPage
  useEffect(() => {
    if (isAuthenticated && user?.role === 'student' && location.pathname === '/StudentPage') {
      setSubscriptionChecked(false);
      checkSubscription();
    }
  }, [location.pathname, isAuthenticated, user]);

  useEffect(() => {
    if (!isLoading && authChecked) {
      const path = location.pathname;

      if (isAuthenticated && (path === '/LoginPage' || path === '/CreateUserPage')) {
        if (user?.role === 'teacher') {
          navigate('/TeacherPage', { replace: true });
        } else if (user?.role === 'student') {
          if (subscriptionStatus === 'active') {
            navigate('/StudentPage', { replace: true });
          } else if (subscriptionStatus !== null) {
            navigate('/subscribe', { replace: true });
          }
        }
      }

      const protectedPaths = ['/TeacherPage', '/StudentPage', '/AssignmentPage', '/TeacherExercisesManager'];
      if (!isAuthenticated && protectedPaths.includes(path)) {
        navigate('/LoginPage', { replace: true });
      }

      if (isAuthenticated && user) {
        if (path === '/TeacherPage' && user.role !== 'teacher') navigate('/StudentPage', { replace: true });
        if (path === '/StudentPage' && user.role !== 'student') navigate('/TeacherPage', { replace: true });
        if (path === '/TeacherExercisesManager' && user.role !== 'teacher') navigate('/LoginPage', { replace: true });
      }

      if (
        isAuthenticated &&
        user?.role === 'student' &&
        subscriptionStatus !== null &&
        subscriptionStatus !== 'active' &&
        location.pathname === '/StudentPage'
      ) {
        navigate('/subscribe', { replace: true });
      }
    }
  }, [isLoading, authChecked, isAuthenticated, user, subscriptionStatus, location.pathname, navigate]);

  if (isLoading || (isAuthenticated && user?.role === 'student' && !subscriptionChecked)) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
          <div className="text-white text-lg font-body">Loading...</div>
        </div>
      </div>
    );
  }

  return children;
}

export default AuthWrapper;