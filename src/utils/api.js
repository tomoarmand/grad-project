// utils/api.js
import { envConfig } from '../config/environment.js';
import { logger } from './logger.js';
import { HTTP_STATUS, TIMEOUTS } from '../constants/api.js';

export class ApiClient {
  constructor() {
    this.baseURL = envConfig.apiEndpoint;
    this.defaultTimeout = TIMEOUTS.API_REQUEST;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeout = options.timeout || this.defaultTimeout;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      logger.debug(`API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      logger.debug(`API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', HTTP_STATUS.REQUEST_TIMEOUT, 'TIMEOUT_ERROR');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
      }
      
      throw new ApiError(error.message || 'An unexpected error occurred', 0, 'UNKNOWN_ERROR');
    }
  }
  
  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }
  
  post(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }
  
  put(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }
  
  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  
  get isNetworkError() {
    return this.code === 'NETWORK_ERROR';
  }
  
  get isTimeoutError() {
    return this.code === 'TIMEOUT_ERROR';
  }
  
  get isAuthError() {
    return [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN].includes(this.status);
  }
  
  get isServerError() {
    return this.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
  
  get isClientError() {
    return this.status >= HTTP_STATUS.BAD_REQUEST && this.status < HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}

export const apiClient = new ApiClient();