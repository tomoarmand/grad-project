// hooks/useApiData.js
import { useState, useCallback, useEffect, useRef } from 'react';
import useUserStore from '../store/userStore';

export const useApiData = (url, dependencies = [], options = {}) => {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getAuthHeader, logout } = useUserStore();
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  const fetchData = useCallback(async (customUrl = url) => {
    if (!customUrl || !API_URL) {
      if (isMountedRef.current) {
        setError('Configuration error');
      }
      return;
    }
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (isMountedRef.current) {
      setLoading(true);
      setError('');
    }
    
    try {
      const fullUrl = customUrl.startsWith('http') ? customUrl : `${API_URL}${customUrl}`;
      
      const response = await fetch(fullUrl, {
        headers: { 
          ...getAuthHeader(), 
          'Content-Type': 'application/json' 
        },
        signal: abortControllerRef.current.signal,
        ...options.fetchOptions
      });
      
      if (!isMountedRef.current) return;
      
      // Handle authentication errors
      if (response.status === 401) {
        logout();
        if (typeof window !== 'undefined' && window.location) {
          window.location.href = '/login';
        }
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (isMountedRef.current) {
        // Apply data transformation if provided
        const transformedData = options.transform ? options.transform(result) : result;
        setData(transformedData);
      }
    } catch (err) {
      if (isMountedRef.current && err.name !== 'AbortError') {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          setError('Network error. Please check your connection.');
        } else {
          setError(err.message || 'An error occurred');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, API_URL, getAuthHeader, logout, options.transform]);
  
  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetchData();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    setData, // Allow manual data updates
    setError // Allow manual error updates
  };
};