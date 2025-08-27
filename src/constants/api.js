// constants/api.js
export const API_ENDPOINTS = {
    // User endpoints
    USERS: '/users',
    LOGIN: '/users/login',
    VERIFY_TOKEN: '/users/verify-token',
    LOGOUT: '/users/logout',
    
    // Exercise endpoints
    EXERCISES: '/exercises',
    EXERCISES_BY_FOLDER: (folderId) => `/exercises/folder/${folderId}`,
    
    // Folder endpoints
    FOLDERS: '/folders',
    FOLDERS_BY_TEACHER: (teacherId) => `/folders/${teacherId}`,
    
    // Assignment endpoints
    ASSIGNMENTS: '/assignments',
    ASSIGN_EXERCISES: '/assignments/assign',
    UNASSIGN_EXERCISES: '/assignments/unassign',
    STUDENTS_WITH_ASSIGNMENTS: (teacherId) => `/assignments/students/by-teacher/${teacherId}`,
  };
  
  export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  };
  
  export const ERROR_CODES = {
    // Authentication errors
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    MISSING_TOKEN: 'MISSING_TOKEN',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    
    // Validation errors
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_FULL_NAME: 'INVALID_FULL_NAME',
    MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
    
    // Business logic errors
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INCORRECT_ACCESS_CODE: 'INCORRECT_ACCESS_CODE',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    
    // Server errors
    SERVER_ERROR: 'SERVER_ERROR',
    DB_ERROR: 'DB_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  };