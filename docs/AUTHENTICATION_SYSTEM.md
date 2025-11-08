# SongShare Authentication System

## 🔐 **Overview**

SongShare implements a dual authentication system that supports both anonymous visitors and authenticated users with seamless token switching and Row Level Security (RLS) enforcement.

## 🏗️ **Architecture**

### **Two-Token System**

1. **Visitor Tokens** - For anonymous users
   - Shared JWT for a special "visitor" user account
   - Provides read-only access to public data (`*_public` tables)
   - JWT structure: `{ app_metadata: { visitor_id: "uuid" } }`

2. **User Tokens** - For authenticated users
   - Individual JWT for each authenticated user
   - Provides full CRUD access to user's own data and read access to public data
   - JWT structure: `{ sub: "user_id", app_metadata: { user: { user_id: "uuid" } } }`

### **Automatic Token Switching**

The system automatically selects the appropriate token:

- **User signed in**: Use user token for all operations
- **User signed out**: Fall back to visitor token for browsing
- **Token expired**: Automatic refresh on next request

## 📁 **File Structure**

```
├── api/src/
│   ├── supabaseClientToken.ts     # Server-side token generation
│   └── server.ts                   # Authentication API endpoints
├── react/src/
│   ├── supabaseClient.ts          # Client creation with authentication
│   ├── services/auth.ts           # Client-side authentication service
│   ├── components/SignInForm.tsx  # Ready-to-use sign-in component
│   └── examples/AuthTokenDemo.tsx # Authentication demonstration
└── docs/
    ├── AUTHENTICATION_SYSTEM.md   # This file
    ├── TOKEN_STRUCTURE_FIX.md     # Technical implementation details
    └── test-token-structure.ts    # Token validation utilities
```

## 🔧 **Implementation Details**

### **Server-Side (API)**

#### **Token Generation (`api/src/supabaseClientToken.ts`)**

```typescript
// Visitor token generation
export async function getSupabaseClientToken(env: Env): Promise<string>;

// User token generation with proper metadata structure
export async function getSupabaseUserToken(
	env: Env,
	email: string,
	password: string,
): Promise<string>;
```

**Key Features:**

- **Self-correcting metadata**: Automatically adds required JWT claims for RLS
- **Token caching**: Reuses valid tokens to reduce database calls
- **Expiration handling**: Respects token expiry times
- **Error handling**: Graceful failure with detailed error messages

#### **API Endpoints (`api/src/server.ts`)**

```typescript
// Visitor token endpoint
GET /api/auth/visitor
Response: { access_token, token_type: "bearer", expires_in: 3600 }

// User authentication endpoint
POST /api/auth/user
Request: { email: string, password: string }
Response: { access_token, token_type: "bearer", expires_in: 3600 }
```

### **Client-Side (React)**

#### **Authentication Service (`react/src/services/auth.ts`)**

```typescript
// Core authentication functions
export async function getSupabaseClientToken(): Promise<string>; // Visitor token
export async function signInUser(
	email: string,
	password: string,
): Promise<string>; // User sign-in
export async function getCurrentAuthToken(): Promise<string>; // Smart token selection
export function signOutUser(): void; // Clear user session
export function isUserSignedIn(): boolean; // Check auth status
```

**Security Features:**

- **In-memory storage**: Tokens stored in memory, not localStorage or cookies
- **Automatic cleanup**: Expired tokens automatically removed
- **Token isolation**: User and visitor tokens managed separately

#### **Supabase Client Creation (`react/src/supabaseClient.ts`)**

```typescript
// Automatically uses appropriate token (user or visitor)
export async function getSupabaseClientWithAuth(): Promise<
	SupabaseClient | undefined
>;

// Manual token specification
export function getSupabaseClient(token: string): SupabaseClient | undefined;
```

## 🗄️ **Database Integration**

### **RLS Policies**

The database uses Row Level Security policies that recognize both token types:

```sql
-- Public tables: Accessible to both visitors and users
CREATE POLICY "song_public_access" ON song_public FOR SELECT TO authenticated
USING (
  -- Visitor token access
  (auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
  OR
  -- User token access
  (auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL
);

-- Private tables: Only accessible to data owners
CREATE POLICY "song_private_access" ON song FOR SELECT TO authenticated
USING (
  user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
);
```

### **Database Schema**

- **`song`** - Private song data (notes, metadata) - User access only
- **`song_public`** - Public song data (name, slides, etc.) - Visitor + User access
- **`user`** - Private user data (email, settings, etc.) - User access only
- **`user_public`** - Public user profiles (username) - Visitor + User access

## 🚀 **Usage Examples**

### **Basic Authentication Flow**

```typescript
import { isUserSignedIn, signInUser, signOutUser } from "./services/auth";

// Check authentication status
if (isUserSignedIn()) {
	console.log("User is signed in");
}

// Sign in a user
try {
	await signInUser("user@example.com", "password");
	console.log("User signed in successfully");
} catch (error) {
	console.error("Sign in failed:", error);
}

// Sign out
signOutUser();
```

### **Using Supabase Client**

```typescript
import { getSupabaseClientWithAuth } from "./supabaseClient";

// This automatically uses the correct token (user or visitor)
const client = await getSupabaseClientWithAuth();

// Query will use appropriate authentication context
const { data, error } = await client.from("song_public").select("*");
```

### **React Components**

```tsx
import { SignInForm } from "./components/SignInForm";
import { AuthTokenDemo } from "./examples/AuthTokenDemo";

function App() {
	return (
		<div>
			<SignInForm />
			<AuthTokenDemo />
		</div>
	);
}
```

## 🔒 **Security Model**

### **Access Patterns**

| User State  | Public Tables (`*_public`)                  | Private Tables (`song`, `user`) |
| ----------- | ------------------------------------------- | ------------------------------- |
| **Visitor** | ✅ Read all records                         | ❌ No access                    |
| **User**    | ✅ Read all records<br/>✅ CRUD own records | ✅ CRUD own records only        |

### **Token Security**

- **Client-side**: In-memory storage prevents XSS/CSRF attacks
- **Server-side**: Service key operations isolated from client access
- **Network**: HTTPS required for production deployment
- **Expiration**: 1-hour token lifetime with automatic refresh

### **RLS Enforcement**

All database operations automatically enforce access control:

- **Visitor queries**: Can only access public data
- **User queries**: Can access public data + own private data
- **Cross-user access**: Blocked by RLS policies

## 🧪 **Testing & Debugging**

### **Token Structure Validation**

```typescript
import { runTokenTests } from "./docs/test-token-structure";

// Verify token structures match RLS expectations
await runTokenTests();
```

### **Authentication Demo**

Use the `AuthTokenDemo` component to see real-time token switching:

```tsx
import { AuthTokenDemo } from "./examples/AuthTokenDemo";

// Shows current token status and allows testing sign-in/out
<AuthTokenDemo />;
```

### **Manual Testing**

1. **Start in visitor mode**: Browse public songs without signing in
2. **Sign in**: Use SignInForm component to authenticate
3. **Verify access**: Try accessing private data (should work for own data)
4. **Sign out**: Return to visitor mode (private access should fail)

## 🔧 **Environment Setup**

### **Required Environment Variables**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Visitor Account (create in Supabase Auth)
SUPABASE_VISITOR_EMAIL=visitor@yourdomain.com
SUPABASE_VISITOR_PASSWORD=secure-visitor-password

# Frontend Configuration
API_BASE_URL=http://localhost:8787  # Development API URL
```

### **Supabase Setup**

1. **Create visitor user account** in Supabase Auth dashboard
2. **Set up RLS policies** using the provided SQL templates
3. **Configure environment variables** with your project credentials
4. **Test authentication flow** using the provided test utilities

## 📈 **Performance Considerations**

### **Token Caching**

- **Server-side**: Tokens cached until expiry (reduces auth operations)
- **Client-side**: In-memory caching prevents redundant API calls
- **Automatic cleanup**: Expired tokens removed from cache

### **Database Optimization**

- **RLS policies**: Indexed on user_id columns for fast filtering
- **Connection pooling**: Supabase handles connection management
- **Query optimization**: RLS enforcement happens at database level

## 🔄 **Migration & Deployment**

### **From Visitor-Only to Dual Authentication**

1. **Update imports**: Change `getSupabaseClientToken` to `getCurrentAuthToken`
2. **Add sign-in UI**: Include `SignInForm` component in your app
3. **Test flows**: Verify both visitor and user authentication work
4. **Deploy**: No database changes required

### **Production Deployment**

1. **Set environment variables** in Cloudflare Workers/Pages
2. **Update CORS origins** in API configuration
3. **Verify HTTPS** for all authentication endpoints
4. **Test token refresh** behavior in production environment

## 🆘 **Troubleshooting**

### **Common Issues**

**"Invalid JWT" errors:**

- Check that environment variables are set correctly
- Verify visitor user exists in Supabase Auth
- Ensure RLS policies match token structure

**"Access denied" errors:**

- Verify RLS policies are created and enabled
- Check that user_id fields match between tables
- Test with the token structure validation utility

**Token refresh failures:**

- Check network connectivity to API endpoints
- Verify CORS configuration allows authentication requests
- Monitor token expiration times and caching behavior

### **Debug Tools**

```typescript
// Inspect token structure (development only)
import { runTokenTests } from "./docs/test-token-structure";

// Check current authentication state
console.log("Signed in:", isUserSignedIn());

await runTokenTests();

// Monitor Supabase operations
const client = await getSupabaseClientWithAuth();
client.auth.onAuthStateChange((event, session) => {
	console.log("Auth event:", event, session);
});
```

## 🔮 **Future Enhancements**

### **Planned Features**

- **Refresh tokens**: Longer-lived sessions with automatic refresh
- **Role-based access**: Admin, premium user roles with different permissions
- **Social authentication**: Google, GitHub OAuth integration
- **Multi-tenant**: Organization-based access control
- **Offline support**: Local token validation for offline-first apps

### **Scaling Considerations**

- **Token storage**: Consider Redis for distributed token caching
- **Rate limiting**: Implement authentication attempt limits
- **Audit logging**: Track authentication events for security monitoring
- **Session management**: Admin tools for managing user sessions

---

This authentication system provides a secure, scalable foundation for user management while maintaining the simplicity of anonymous browsing through the visitor token system.
