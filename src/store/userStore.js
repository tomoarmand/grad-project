import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Action to set user data
      setUser: (userData) => set({ 
        user: userData, 
        isAuthenticated: !!userData,
        error: null 
      }),

      // Action to set authentication token
      setToken: (token) => {
        set({ token, error: null });
        if (token) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
      },

      // Action to clear all user data (logout)
      clearUser: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          loading: false, 
          error: null 
        });
        localStorage.removeItem('authToken');
      },

      // Initialize authentication from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('authToken');
        if (token) {
          set({ token });
        }
        return token || null;
      },

      // Get authorization header for API calls
      getAuthHeader: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      // Role checking utilities
      hasRole: (role) => get().user?.role === role,
      isTeacher: () => get().user?.role === 'teacher',
      isStudent: () => get().user?.role === 'student',

      // Set loading state
      setLoading: (loading) => set({ loading }),

      // Set error state
      setError: (error) => set({ error }),

      // Clear error state
      clearError: () => set({ error: null }),

      // Verify token with backend
      verifyToken: async () => {
        const { token, setLoading, clearUser } = get();
        
        if (!token) {
          return false;
        }

        setLoading(true);
        
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/users/verify-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });

          if (!response.ok) {
            // Token is invalid or expired
            clearUser();
            return false;
          }

          const userData = await response.json();
          
          // Validate that we got proper user data
          if (userData?._id && userData?.role) {
            set({ 
              user: userData, 
              isAuthenticated: true, 
              loading: false, 
              error: null 
            });
            return true;
          } else {
            clearUser();
            return false;
          }
        } catch (error) {
          console.error('Token verification error:', error);
          set({ loading: false, error: 'Network error during authentication' });
          return false;
        }
      },

      // Login function
      login: async (loginData) => {
        const { setLoading, setError, setToken, setUser } = get();
        
        setLoading(true);
        setError(null);

        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
          });

          const data = await response.json();

          if (!response.ok) {
            setLoading(false);
            setError(data.error || 'Login failed');
            return { success: false, error: data.error || 'Login failed' };
          }

          // Login successful
          setToken(data.token);
          setUser({
            _id: data._id,
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
          setLoading(false);

          return { success: true, user: data };
        } catch (error) {
          console.error('Login error:', error);
          setLoading(false);
          setError('Network error during login');
          return { success: false, error: 'Network error during login' };
        }
      },

      // Register function
      register: async (registerData) => {
        const { setLoading, setError, setToken, setUser } = get();
        
        setLoading(true);
        setError(null);

        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
          });

          const data = await response.json();

          if (!response.ok) {
            setLoading(false);
            setError(data.error || 'Registration failed');
            return { success: false, error: data.error || 'Registration failed' };
          }

          // Registration successful - automatically log in
          setToken(data.token);
          setUser({
            _id: data._id,
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
          setLoading(false);

          return { success: true, user: data };
        } catch (error) {
          console.error('Registration error:', error);
          setLoading(false);
          setError('Network error during registration');
          return { success: false, error: 'Network error during registration' };
        }
      },

      // Logout function
      logout: () => {
        get().clearUser();
      },

      // Update user profile
      updateProfile: async (profileData) => {
        const { token, user, setLoading, setError, setUser } = get();
        
        if (!token || !user) {
          return { success: false, error: 'Not authenticated' };
        }

        setLoading(true);
        setError(null);

        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/users/${user._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData),
          });

          const data = await response.json();

          if (!response.ok) {
            setLoading(false);
            setError(data.error || 'Profile update failed');
            return { success: false, error: data.error || 'Profile update failed' };
          }

          // Update successful
          setUser(data);
          setLoading(false);

          return { success: true, user: data };
        } catch (error) {
          console.error('Profile update error:', error);
          setLoading(false);
          setError('Network error during profile update');
          return { success: false, error: 'Network error during profile update' };
        }
      },
    }),
    {
      name: 'user-storage',
      // Only persist user data and auth state, not temporary states like loading/error
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useUserStore;