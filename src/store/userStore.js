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
      
      // Verify token with backend - enhanced with better error handling
      verifyToken: async () => {
        const { token } = get();
        if (!token) {
          console.log('No token found for verification');
          return false;
        }
        
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          console.log('🔍 verifyToken: API_URL is:', API_URL);
          
          if (!API_URL) {
            console.error('API_URL not configured');
            return null; // Return null for configuration errors
          }

          const url = `${API_URL}/users/verify-token`;
          console.log('🔍 verifyToken: Attempting to fetch:', url);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🔍 verifyToken: Response status:', response.status);
          console.log('🔍 verifyToken: Response ok:', response.ok);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('🔍 verifyToken: Received user data:', userData);
            
            // Verify we got valid user data
            if (userData && userData._id && userData.role) {
              set({ 
                user: userData, 
                isAuthenticated: true 
              });
              console.log('Token verified successfully for user:', userData.email);
              return true;
            } else {
              console.error('Invalid user data received from token verification');
              get().clearUser();
              return false;
            }
          } else if (response.status === 401 || response.status === 403) {
            // Explicit authentication failure
            const errorData = await response.json().catch(() => ({}));
            console.log('Token verification failed (unauthorized):', errorData.error || 'Token invalid');
            get().clearUser();
            return false;
          } else {
            // Server error (500, etc) - don't clear user
            console.log('Server error during token verification:', response.status);
            return null;
          }
        } catch (error) {
          console.error('🔍 verifyToken: Detailed error:', error);
          console.error('🔍 verifyToken: Error name:', error.name);
          console.error('🔍 verifyToken: Error message:', error.message);
          // Network error - don't clear user, return null to indicate network issue
          return null;
        }
      },

      // Login helper - combines login API call with state management
      login: async (loginData) => {
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          
          const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(loginData),
          });

          if (response.ok) {
            const userData = await response.json();

            if (userData && userData.token && userData._id && userData.role) {
              // Set token first
              get().setToken(userData.token);
              
              // Create clean user object (without token)
              const cleanUser = {
                _id: userData._id,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
              };

              // Set user data
              get().setUser(cleanUser);
              
              return { success: true, user: cleanUser };
            } else {
              return { success: false, error: 'Invalid response from server' };
            }
          } else {
            const errorResponse = await response.json();
            return { 
              success: false, 
              error: errorResponse.error || 'Login failed' 
            };
          }
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            error: 'Network error. Please check your connection and try again.' 
          };
        }
      },

      // Logout helper
      logout: () => {
        get().clearUser();
        console.log('User logged out successfully');
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