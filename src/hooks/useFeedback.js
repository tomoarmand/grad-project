// hooks/useFeedback.js
import { useState, useEffect, useCallback } from 'react';

export const useFeedback = (autoHideDuration = 3000) => {
  const [feedback, setFeedback] = useState(null);
  
  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, msg: message, timestamp: Date.now() });
  }, []);
  
  const showSuccess = useCallback((message) => {
    showFeedback('success', message);
  }, [showFeedback]);
  
  const showError = useCallback((message) => {
    showFeedback('error', message);
  }, [showFeedback]);
  
  const showWarning = useCallback((message) => {
    showFeedback('warning', message);
  }, [showFeedback]);
  
  const showInfo = useCallback((message) => {
    showFeedback('info', message);
  }, [showFeedback]);
  
  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);
  
  useEffect(() => {
    if (feedback && autoHideDuration > 0) {
      const timer = setTimeout(clearFeedback, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [feedback, autoHideDuration, clearFeedback]);
  
  return { 
    feedback, 
    showFeedback, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    clearFeedback 
  };
};