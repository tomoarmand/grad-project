// constants/ui.js
export const LOADING_MESSAGES = {
  FETCHING_STUDENTS: 'Loading students...',
  FETCHING_EXERCISES: 'Loading exercises...',
  FETCHING_FOLDERS: 'Loading folders...',
  ASSIGNING: 'Assigning exercises...',
  UNASSIGNING: 'Unassigning exercise...',
  CREATING_USER: 'Creating account...',
  LOGGING_IN: 'Signing in...',
  VERIFYING_TOKEN: 'Verifying session...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
};

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'Account created successfully!',
  LOGIN_SUCCESS: 'Signed in successfully!',
  ASSIGNMENT_SUCCESS: (count) => `Exercise${count === 1 ? '' : 's'} assigned successfully!`,
  UNASSIGNMENT_SUCCESS: 'Exercise unassigned successfully!',
  FOLDER_CREATED: 'Folder created successfully!',
  FOLDER_UPDATED: 'Folder updated successfully!',
  FOLDER_DELETED: 'Folder deleted successfully!',
  EXERCISE_CREATED: 'Exercise created successfully!',
  EXERCISE_UPDATED: 'Exercise updated successfully!',
  EXERCISE_DELETED: 'Exercise deleted successfully!',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NO_SELECTION: 'Please make a selection first.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  PERMISSION_DENIED: 'You don\'t have permission to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
};

export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    MAX_LENGTH: 100,
  },
  FULL_NAME: {
    PATTERN: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  ACCESS_CODE: {
    PATTERN: /^[a-zA-Z0-9]{4,10}$/,
    MIN_LENGTH: 4,
    MAX_LENGTH: 10,
  },
  FOLDER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  EXERCISE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
};

export const TIMEOUTS = {
  API_REQUEST: 15000, // 15 seconds
  TOKEN_VERIFICATION: 10000, // 10 seconds
  FILE_UPLOAD: 60000, // 60 seconds
  FEEDBACK_AUTO_HIDE: 3000, // 3 seconds
};

export const CACHE_KEYS = {
  USER_TOKEN: 'authToken',
  USER_DATA: 'user-storage',
  INSTALL_BANNER_SHOWN: 'kenToneInstallBannerShown',
  APP_INSTALLED: 'kenToneAppInstalled',
  INSTALLED_MESSAGE_SHOWN: 'kenToneInstalledMessageShown',
};