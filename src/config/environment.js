// config/environment.js
class EnvironmentConfig {
    constructor() {
      this.isDevelopment = import.meta.env.MODE === 'development';
      this.isProduction = import.meta.env.PROD;
      this.apiUrl = import.meta.env.VITE_API_URL;
      
      // Validate required environment variables
      this.validateEnvironment();
    }
    
    validateEnvironment() {
      const requiredVars = ['VITE_API_URL'];
      const missing = requiredVars.filter(varName => !import.meta.env[varName]);
      
      if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        if (this.isProduction) {
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
      }
    }
    
    get apiEndpoint() {
      if (!this.apiUrl) {
        if (this.isDevelopment) {
          return 'http://localhost:5000'; // Fallback for development
        }
        throw new Error('API URL is not configured');
      }
      return this.apiUrl;
    }
    
    get logLevel() {
      return this.isDevelopment ? 'debug' : 'error';
    }
    
    get enableDebugMode() {
      return this.isDevelopment || import.meta.env.VITE_DEBUG === 'true';
    }
    
    get rateLimitBypass() {
      return this.isDevelopment;
    }
  }
  
  export const envConfig = new EnvironmentConfig();