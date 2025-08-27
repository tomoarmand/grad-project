// hooks/useAsyncOperation.js
import { useState, useCallback, useRef, useEffect } from 'react';

export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const execute = useCallback(async (asyncFunction, options = {}) => {
    if (!isMountedRef.current) return null;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await asyncFunction();
      
      if (isMountedRef.current && options.onSuccess) {
        options.onSuccess(result);
      }
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        if (options.onError) {
          options.onError(err);
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);
  
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(false);
      setError('');
    }
  }, []);
  
  return { loading, error, execute, reset };
};