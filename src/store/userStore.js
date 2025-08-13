import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (userData) => {
        set({ 
          user: userData, 
          isAuthenticated: !!userData 
        });
      },
      
      setToken: (tokenValue) => {
        set({ token: tokenValue });
        if (tokenValue) {
          localStorage.setItem('authToken', tokenValue);
        } else {
          localStorage.removeItem('authToken');
        }
      },
      
      clearUser: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        localStorage.removeItem('authToken');
      },
      
      // Initialize token from localStorage on app start
      initializeAuth: () => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          set({ token: storedToken });
          return storedToken;
        }
        return null;
      },
      
      // Get authorization header for API calls
      getAuthHeader: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      
      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },
      
      // Check if user is teacher
      isTeacher: () => {
        const { user } = get();
        return user?.role === 'teacher';
      },
      
      // Check if user is student
      isStudent: () => {
        const { user } = get();
        return user?.role === 'student';
      },
      
      // Verify token with backend
      verifyToken: async () => {
        const { token } = get();
        if (!token) return false;
        
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/users/verify-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            set({ 
              user: userData, 
              isAuthenticated: true 
            });
            return true;
          } else {
            // Token is invalid, clear auth state
            get().clearUser();
            return false;
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          get().clearUser();
          return false;
        }
      }
    }),
    {
      name: 'user-storage',
      // Only persist user data and authentication status, not the token
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useUserStore;