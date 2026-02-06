````markdown
# SongShare Authentication System

## 🔐 **Overview**

SongShare implements a dual authentication system that supports both anonymous visitors and authenticated users with seamless token switching and Row Level Security (RLS) enforcement.

**Key Architecture**: Uses a **single Supabase auth user** (the "visitor" account) with dynamic `app_metadata` updates to support both anonymous and authenticated access. This approach enables Realtime subscriptions while maintaining RLS-based access control.

### Why a Single Auth User?

**Supabase Realtime requires authenticated JWT tokens** - it cannot work with anonymous/unauthenticated connections. The single visitor account solves this by:

1. **Authentication (transport layer)**: The visitor account provides valid Supabase-signed JWTs that enable Realtime WebSocket connections
2. **Authorization (access control)**: RLS policies check JWT `app_metadata` to determine what data each user can access

**Why not fully open/anonymous?**
- ❌ Realtime subscriptions would not work (requires authenticated connection)
- ❌ No way to establish WebSocket connections
- ❌ Cannot filter events server-side

**Why not individual Supabase auth users per app user?**
- ❌ More complex (manage two separate user systems)
- ❌ Unnecessary overhead (RLS can distinguish users via metadata)
- ❌ Harder to maintain (sync between Supabase auth + app users)

The single visitor account is essentially a **"transport layer"** that makes Realtime work while RLS handles security.

> 📖 **For detailed technical documentation** on Realtime subscriptions, RLS policies, and implementation patterns, see [realtime-rls-architecture.md](./realtime-rls-architecture.md).

## 🏗️ **Architecture**

### **Two-Token System**

1. **Visitor Tokens** - For anonymous users
   - Uses the shared "visitor" Supabase auth account
   - Provides read-only access to public data (`*_public` tables)
   - JWT structure: `{ app_metadata: { visitor_id: "visitor-uuid" } }`

2. **User Tokens** - For authenticated users
   - Uses the **same** "visitor" Supabase auth account
   - Updates `app_metadata` to include user context
   - Provides full CRUD access to user's own data and read access to public data
   - JWT structure: `{ app_metadata: { visitor_id: "visitor-uuid", user: { user_id: "app-user-uuid" } } }`

### **Automatic Token Switching**

The system automatically selects the appropriate token:

- **User signed in**: Use user token for all operations
- **User signed out**: Fall back to visitor token for browsing
- **Token expired**: Automatic refresh on next request

## 📁 **File Structure**

```
├── api/src/
│   ├── supabase/
│   │   └── getSupabaseClientToken.ts  # Visitor token generation
│   ├── user-session/
│   │   └── getUserToken.ts            # User token generation
│   └── server.ts                       # Authentication API endpoints
├── react/src/
│   ├── supabase/
│   │   ├── supabaseClient.ts          # Client creation with authentication
│   │   └── getSupabaseAuthToken.ts    # Token selection logic
│   └── auth/
│       └── auth-slice.ts               # Authentication state management
└── docs/
    ├── authentication-system.md        # This file (overview)
    └── realtime-rls-architecture.md    # Detailed technical guide
```

## 🔧 **Implementation Details**

### **Server-Side (API)**

#### **Token Generation**

**Visitor Token** (`api/src/supabase/getSupabaseClientToken.ts`):
1. Sign in to Supabase as visitor user
2. Check if `app_metadata.visitor_id` exists
3. If missing, update metadata and re-sign
4. Return `access_token`

**User Token** (`api/src/user-session/getUserToken.ts`):
1. Verify user session (from session JWT cookie)
2. Sign in to Supabase as visitor user
3. Update `app_metadata` to include `user: { user_id: "app-user-uuid" }`
4. Sign in again to get fresh JWT with user metadata
5. Return `access_token`

**Key Features:**

- **Self-correcting metadata**: Automatically adds required JWT claims for RLS
- **Token caching**: Reuses valid tokens to reduce database calls
- **Expiration handling**: Respects token expiry times
- **Error handling**: Graceful failure with detailed error messages

#### **API Endpoints**

```typescript
// Visitor token endpoint
GET /api/auth/visitor
Response: { access_token, token_type: "bearer", expires_in: 3600 }

// User token endpoint (requires valid session cookie)
GET /api/auth/user/token
Response: { access_token, token_type: "bearer", expires_in: 3600 }
```

### **Client-Side (React)**

#### **Token Management** (`react/src/supabase/getSupabaseAuthToken.ts`)

```typescript
// Automatic token selection
export async function getSupabaseAuthToken(): Promise<string | undefined>;
// - If user signed in: fetch from /api/auth/user/token
// - If user signed out: fetch from /api/auth/visitor
// - Caches tokens in memory until expiry
```

#### **Authentication State** (`react/src/auth/auth-slice.ts`)

```typescript
// Core authentication functions
signIn(): Promise<void>;        // Fetch and cache user token
signOut(): void;                // Clear user session
setIsSignedIn(value: boolean);  // Update auth state
```

**Security Features:**

- **In-memory storage**: Tokens stored in memory, not localStorage or cookies
- **Automatic cleanup**: Expired tokens automatically removed
- **Token isolation**: User and visitor tokens managed separately
- **Single auth user**: All JWTs signed by Supabase using the visitor account
- **RLS enforcement**: Access control via JWT `app_metadata` claims

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

### **Using Supabase Client** (Recommended)

```typescript
import { getSupabaseClientWithAuth } from "@/react/supabase/supabaseClient";

// Automatically uses the correct token (user or visitor)
const client = await getSupabaseClientWithAuth();

if (!client) {
  throw new Error("Failed to initialize Supabase client");
}

// Query will use appropriate authentication context
const { data, error } = await client.from("song_public").select("*");
```

### **Realtime Subscriptions**

```typescript
const client = await getSupabaseClientWithAuth();

// Subscribe to changes - RLS automatically filters based on JWT
const channel = client
  .channel('song_library_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'song_library'
  }, (payload) => {
    console.log('Change received:', payload);
  })
  .subscribe();
```

> 📖 **See [realtime-rls-architecture.md](./realtime-rls-architecture.md)** for detailed Realtime and RLS implementation patterns.

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

### **Manual Testing**

1. **Start in visitor mode**: Browse public data without signing in
2. **Sign in via OAuth**: Authenticate with Google/GitHub
3. **Verify access**: Check that user-specific data (library) loads
4. **Check Realtime**: Verify subscriptions receive updates
5. **Sign out**: Return to visitor mode (library should be empty)

### **Debug JWT Structure**

```typescript
// In browser console - decode the current token
const token = await getSupabaseAuthToken();
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT claims:', payload);
console.log('app_metadata:', payload.app_metadata);
```

### **Common Debugging**

```typescript
// Check current auth state
import useAppStore from '@/react/app/useAppStore';
const isSignedIn = useAppStore((state) => state.auth.isSignedIn);
console.log('Is signed in:', isSignedIn);

// Monitor token fetching
// Check browser console for "[authSlice]" and "[getSupabaseAuthToken]" logs
```

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

### Local development: Google OAuth redirect URIs

When developing locally the application can run over either http or https (for example, Vite served with mkcert for HTTPS or a plain HTTP dev server). To support OAuth sign-ins from Google in either case:

- Register both redirect URIs in the Google Cloud Console (if using the same port for http/https):
  - http://localhost:5173/api/oauth/callback
  - https://localhost:5173/api/oauth/callback
- The API prefers the incoming request's scheme when OAUTH_REDIRECT_ORIGIN points at `localhost` and ENVIRONMENT is not `production`. This means you can keep a single OAUTH_REDIRECT_ORIGIN value (even if it contains https) and the API will use the request's actual scheme while running locally.

Note: for non-localhost origins Google requires HTTPS; keep that in mind for staging/production.

CI/workflows compatibility

The repository CI workflows already run a preview server (Vite preview) and Playwright tests. They now accept either http or https for the preview server during CI runs — the workflows will probe http://localhost:5173 and http://127.0.0.1:5173 first, then fall back to https://localhost:5173 and https://127.0.0.1:5173 as needed. No further configuration is required for GitHub Actions to run E2E or smoke tests whether your dev machine uses mkcert (HTTPS) or plain HTTP.

### **Supabase Setup**

1. **Create visitor user account** in Supabase Auth dashboard
   - Email: `visitor@yourdomain.com` (set in env vars)
   - Password: Secure random password (set in env vars)
   - This is the **only** Supabase auth user needed

2. **Set up RLS policies** using the SQL templates in [realtime-rls-architecture.md](./realtime-rls-architecture.md)

3. **Configure environment variables** with your project credentials

4. **Test authentication flow** using OAuth sign-in

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

**"JwtSignatureError: Failed to validate JWT signature"**

- **Cause:** JWT not signed by Supabase
- **Solution:** Use the visitor account sign-in approach (as implemented)
- **Never:** Manually sign JWTs without Supabase's JWT secret

**"No suitable key or wrong key type" (PGRST301)**

- **Cause:** JWT missing required `app_metadata` for RLS
- **Solution:** Ensure user token includes `app_metadata.user.user_id`
- **Check:** Verify metadata update and re-sign flow in `getUserToken.ts`

**Realtime subscriptions not working**

- **Cause:** RLS blocking events or token not set correctly
- **Debug:** Check `client.realtime.setAuth(token)` is called
- **Verify:** JWT has proper metadata structure

**Library shows 0 entries after sign-in**

- **Cause:** User token not being fetched or cached
- **Debug:** Check browser console for `[authSlice]` logs
- **Verify:** `/api/auth/user/token` returns 200 status

### **Debug Tools**

```typescript
// Check current token and its claims
const token = await getSupabaseAuthToken();
const claims = JSON.parse(atob(token.split('.')[1]));
console.log('Token claims:', claims);

// Test database access with current token
const client = await getSupabaseClientWithAuth();
const { data, error } = await client.from('song_library').select('*');
console.log('Library query:', { data, error });

// Monitor Realtime connection
client.channel('test')
  .on('system', (msg) => console.log('Realtime system:', msg))
  .subscribe();
```

> 📖 **For more debugging techniques**, see [realtime-rls-architecture.md](./realtime-rls-architecture.md#troubleshooting).

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

**For detailed technical documentation including:**
- Realtime subscription patterns
- Complete RLS policy examples
- Performance optimization strategies
- Security best practices
- Migration guides

**See:** [realtime-rls-architecture.md](./realtime-rls-architecture.md)

---

This authentication system provides a secure, scalable foundation for user management while maintaining the simplicity of anonymous browsing through a single shared Supabase auth user.
````
