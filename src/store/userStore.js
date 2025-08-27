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
          console.log('verifyToken: API_URL is:', API_URL);
          
          if (!API_URL) {
            console.error('API_URL not configured');
            return null;
          }

          const url = `${API_URL}/users/verify-token`;
          console.log('verifyToken: Attempting to fetch:', url);

          // Enhanced fetch with timeout and retry logic
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          console.log('verifyToken: Response status:', response.status);
          console.log('verifyToken: Response ok:', response.ok);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('verifyToken: Received user data:', userData);
            
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
          } else if (response.status === 429) {
            // Rate limited - don't clear user, just return null
            console.log('Token verification rate limited');
            return null;
          } else if (response.status >= 500) {
            // Server error - don't clear user
            console.log('Server error during token verification:', response.status);
            return null;
          } else {
            // Other client errors
            const errorData = await response.json().catch(() => ({}));
            console.log('Token verification failed:', errorData.error || 'Unknown error');
            get().clearUser();
            return false;
          }
        } catch (error) {
          console.error('verifyToken: Detailed error:', error);
          
          // Handle specific error types
          if (error.name === 'AbortError') {
            console.log('Token verification timed out');
            return null; // Don't clear user on timeout
          }
          
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Network error during token verification');
            return null; // Don't clear user on network error
          }
          
          // Other errors - return null to indicate network/server issue
          return null;
        }
      },

      // Login helper - enhanced with better error handling and retry logic
      login: async (loginData) => {
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          
          if (!API_URL) {
            return { 
              success: false, 
              error: 'Configuration error. Please contact support.' 
            };
          }
          
          // Enhanced fetch with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(loginData),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

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
            const errorResponse = await response.json().catch(() => ({}));
            
            // Handle specific error codes from backend
            const errorMessage = errorResponse.code ? 
              get().getErrorMessage(errorResponse.code, errorResponse.error) : 
              errorResponse.error || 'Login failed';
              
            return { 
              success: false, 
              error: errorMessage,
              code: errorResponse.code
            };
          }
        } catch (error) {
          console.error('Login error:', error);
          
          if (error.name === 'AbortError') {
            return { 
              success: false, 
              error: 'Login request timed out. Please try again.' 
            };
          }
          
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { 
              success: false, 
              error: 'Network error. Please check your connection and try again.' 
            };
          }
          
          return { 
            success: false, 
            error: 'An unexpected error occurred. Please try again.' 
          };
        }
      },

      // Helper function to translate backend error codes to user-friendly messages
      getErrorMessage: (code, fallbackMessage) => {
        const errorMessages = {
          'MISSING_REQUIRED_FIELDS': 'Please fill in all required fields.',
          'INVALID_EMAIL': 'Please enter a valid email address.',
          'INVALID_FULL_NAME': 'Full name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes.',
          'MISSING_ACCESS_CODE': 'Teacher access code is required.',
          'INVALID_ACCESS_CODE_FORMAT': 'Access code must be 4-10 characters.',
          'INCORRECT_ACCESS_CODE': 'Incorrect teacher access code.',
          'USER_ALREADY_EXISTS': 'An account with this email already exists.',
          'USER_NOT_FOUND': 'No account found with this email address.',
          'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
          'INVALID_TOKEN': 'Invalid session. Please log in again.',
          'SERVER_CONFIG_ERROR': 'Server configuration error. Please contact support.',
          'DB_ERROR': 'Database error. Please try again later.',
          'SERVER_ERROR': 'Server error. Please try again later.'
        };
        
        return errorMessages[code] || fallbackMessage || 'An error occurred.';
      },

      // Register helper - new function for user creation
      register: async (registerData) => {
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          
          if (!API_URL) {
            return { 
              success: false, 
              error: 'Configuration error. Please contact support.' 
            };
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(registerData),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const userData = await response.json();

            if (userData && userData.token && userData._id && userData.role) {
              // Set token first
              get().setToken(userData.token);
              
              // Create clean user object
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
            const errorResponse = await response.json().catch(() => ({}));
            
            const errorMessage = errorResponse.code ? 
              get().getErrorMessage(errorResponse.code, errorResponse.error) : 
              errorResponse.error || 'Registration failed';
              
            return { 
              success: false, 
              error: errorMessage,
              code: errorResponse.code
            };
          }
        } catch (error) {
          console.error('Registration error:', error);
          
          if (error.name === 'AbortError') {
            return { 
              success: false, 
              error: 'Registration request timed out. Please try again.' 
            };
          }
          
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { 
              success: false, 
              error: 'Network error. Please check your connection and try again.' 
            };
          }
          
          return { 
            success: false, 
            error: 'An unexpected error occurred. Please try again.' 
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