// utils/logger.js
class Logger {
    constructor(config) {
      this.config = config;
    }
    
    debug(...args) {
      if (this.config.enableDebugMode) {
        console.log('[DEBUG]', ...args);
      }
    }
    
    info(...args) {
      console.log('[INFO]', ...args);
    }
    
    warn(...args) {
      console.warn('[WARN]', ...args);
    }
    
    error(...args) {
      console.error('[ERROR]', ...args);
    }
    
    group(label, callback) {
      if (this.config.enableDebugMode) {
        console.group(label);
        callback();
        console.groupEnd();
      }
    }
  }
  
  export const logger = new Logger(envConfig);