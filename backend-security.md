Backend Security:

Helmet.js: Sets security headers (CSP, XSS protection, etc.)
Rate limiting: Global (100 req/15min) + Auth endpoints (10 req/15min)
Input sanitization: Removes XSS attempts, script tags, JS injections
NoSQL injection protection: express-mongo-sanitize
XSS protection: xss-clean middleware
Parameter pollution protection: hpp middleware
Request size limits: 10MB limit prevents DoS
JSON validation: Validates JSON format on requests
CORS: Restricts which domains can access your API
MongoDB validation: Schema-level validation with proper constraints

Input Validation:

Email validation: Proper regex + length limits
Name validation: Character restrictions + length limits
Access code format validation: Length + character type checks
Duplicate email prevention: Database uniqueness checks

General Security:

Environment variables: Sensitive data not in code
Error handling: Doesn't leak internal details in production
Graceful shutdown: Proper database connection cleanup
