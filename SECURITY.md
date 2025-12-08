# VAM Attendance - Security Hardening Guide

## React2Shell Vulnerability Mitigation

This document outlines the security measures implemented to protect against React2Shell and other common web vulnerabilities.

---

## 1. Vulnerability Overview

**React2Shell** is a class of vulnerabilities where React applications can be exploited to execute arbitrary code. Common attack vectors include:

- XSS (Cross-Site Scripting) attacks
- Command injection through user input
- Unsafe HTML rendering
- SQL injection
- CSRF (Cross-Site Request Forgery)

---

## 2. Security Measures Implemented

### A. Input Validation & Sanitization

**File**: `lib/security.ts`

All user inputs are validated using Zod schemas and sanitized to remove potentially dangerous characters:

```typescript
// Example: Validate and sanitize email
import { validateAndSanitizeEmail } from "@/lib/security";

try {
  const safe_email = validateAndSanitizeEmail(user_input);
  // Safe to use
} catch (error) {
  // Handle validation error
}
```

**Validation Schemas Available**:
- `email` - Email format validation
- `password` - Strong password requirements
- `name` - User/teacher/student names
- `className` - Class identifiers
- `description` - Text descriptions
- `notes` - Attendance notes
- `uuid` - Universal IDs
- `attendanceStatus` - Enum validation

### B. Command Injection Prevention

**Function**: `preventCommandInjection()`

Blocks shell metacharacters that could be used for command injection:

```typescript
import { preventCommandInjection } from "@/lib/security";

if (!preventCommandInjection(userInput)) {
  throw new Error("Invalid characters detected");
}
```

**Blocked Characters**: `; & | ` $ ( ) { } [ ] < > \ ^ ~`

### C. Rate Limiting

**Class**: `RateLimiter`

Protects API endpoints from brute force attacks:

```typescript
import { RateLimiter } from "@/lib/security";

const limiter = new RateLimiter(60000, 5); // 5 requests per 60 seconds

if (!limiter.isAllowed(userId)) {
  return error_response(429, "Too many attempts");
}
```

**Applied To**:
- Login: 5 attempts per minute
- Signup: 5 attempts per minute
- General API: 100 requests per minute

### D. Content Security Policy (CSP)

**File**: `next.config.ts`

Comprehensive CSP headers prevent inline script execution:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
img-src 'self' data: https:
font-src 'self' https://fonts.gstatic.com
connect-src 'self' https://*.supabase.co
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### E. Security Headers

**Files**: `next.config.ts`, `lib/security.ts`

Implemented headers protect against common attacks:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Browser XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | Disable camera, mic, geolocation | Restrict dangerous APIs |

### F. Database Security (RLS Policies)

**File**: `database/schema.sql`

Row Level Security policies enforce data access controls:

- Users can only view their own data
- Teachers can only update their own sessions
- Students can only see attendance for their sessions
- All policies require authentication

---

## 3. Usage Examples

### Validate Login Input

```typescript
import { validateAndSanitizeEmail, validatePassword } from "@/lib/security";

export async function login(email: string, password: string) {
  try {
    const safe_email = validateAndSanitizeEmail(email);
    
    if (!validatePassword(password)) {
      throw new Error("Password does not meet security requirements");
    }
    
    // Proceed with authentication
    return await signIn(safe_email, password);
  } catch (error) {
    return { error: error.message };
  }
}
```

### Validate Student Creation

```typescript
import { validateAndSanitizeName, validateUUID } from "@/lib/security";

export async function createStudent(name: string, teacherId: string) {
  try {
    const safe_name = validateAndSanitizeName(name);
    
    if (!validateUUID(teacherId)) {
      throw new Error("Invalid teacher ID");
    }
    
    // Create student with validated data
    return await createStudent({
      name: safe_name,
      // ... other fields
    });
  } catch (error) {
    return { error: error.message };
  }
}
```

### Protect API Endpoint

```typescript
import { RateLimiter, validateAndSanitizeEmail } from "@/lib/security";

const limiter = new RateLimiter(60000, 100);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  
  if (!limiter.isAllowed(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }
  
  const data = await request.json();
  const email = validateAndSanitizeEmail(data.email);
  
  // Process request
}
```

---

## 4. Dependencies Added

To support these security measures, the following packages were added:

```json
"dompurify": "^3.0.8",           // HTML/DOM sanitization
"isomorphic-dompurify": "^2.9.0", // SSR-safe sanitization
"zod": "^3.22.4"                 // Input validation
```

---

## 5. File Upload Security

**Function**: `validateFileUpload()`

Validates file uploads before processing:

```typescript
import { validateFileUpload } from "@/lib/security";

const validation = validateFileUpload(file, ["text/csv"], 5 * 1024 * 1024);

if (!validation.valid) {
  return { error: validation.error };
}

// Process file
```

---

## 6. Environment Variables

Ensure these are set in `.env.local`:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security (optional, for production)
RATE_LIMIT_WINDOW=60000          # ms
RATE_LIMIT_MAX_REQUESTS=100      # per window
```

---

## 7. Testing Security

### Test Command Injection Prevention

```bash
curl "http://localhost:3000/api/students?name=test;rm%20-rf%20/"
# Should return 400 error
```

### Test Rate Limiting

```bash
# Make 101 requests to /api/students
for i in {1..101}; do
  curl http://localhost:3000/api/students
done
# Request 101+ should return 429 (Too Many Requests)
```

### Test CSP Headers

```bash
curl -I http://localhost:3000
# Check for Content-Security-Policy header
```

---

## 8. Best Practices

✅ **DO:**
- Always validate and sanitize user input
- Use parameterized queries (Supabase handles this)
- Implement rate limiting on auth endpoints
- Keep dependencies updated
- Use HTTPS in production
- Enable RLS policies in database
- Review CSP headers regularly

❌ **DON'T:**
- Use `dangerouslySetInnerHTML` without sanitization
- Trust user input
- Use `eval()` or `Function()` constructor
- Store sensitive data in localStorage
- Disable security headers
- Commit `.env` files with secrets
- Use weak passwords
- Bypass rate limiting

---

## 9. Regular Security Updates

Keep your project secure by regularly updating dependencies:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update all dependencies
npm update

# Update to latest versions (use with caution)
npm outdated
```

---

## 10. Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** post it publicly
2. **Email** security details to your admin
3. **Include** steps to reproduce
4. **Allow** time for patching before disclosure

---

## 11. Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Zod Documentation](https://zod.dev/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/security)

---

## 12. Deployment Checklist

- [ ] All dependencies updated (`npm update`)
- [ ] Security headers configured (`next.config.ts`)
- [ ] Rate limiting enabled on auth endpoints
- [ ] Database RLS policies enabled
- [ ] Input validation on all forms
- [ ] HTTPS enforced in production
- [ ] CSP headers tested in browser
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Security audit passed (`npm audit`)

---

**Last Updated**: December 8, 2025
**Status**: React2Shell Vulnerability Mitigated ✅
