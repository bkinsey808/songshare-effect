# User Authentication with Token Switching

> ⚠️ **This document has been superseded by [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md)**
>
> Please refer to the comprehensive authentication guide for the latest information.

## Quick Overview

The SongShare application implements a dual authentication system:

1. **Visitor Mode**: Shared JWT token for anonymous users (read-only public data)
2. **User Mode**: Individual JWT tokens for authenticated users (full access to own data)

The system automatically switches between these modes based on authentication status.

## Architecture

### Server-Side (API)

#### Endpoints

1. **`GET /api/auth/visitor`** - Returns visitor token
   - Uses shared visitor user credentials
   - Includes `visitor_id` claim for RLS policies
   - Cached on server for performance

2. **`POST /api/auth/user`** - Returns user-specific token
   - Requires `{ email, password }` in request body
   - Authenticates against real user account
   - Cached per user for performance

#### Token Generation Functions

```typescript
// For visitor tokens
export async function getSupabaseClientToken(env: Env): Promise<string>;

// For user tokens
export async function getSupabaseUserToken(
	env: Env,
	email: string,
	password: string,
): Promise<string>;
```

### Client-Side (React)

#### Authentication Service (`services/auth.ts`)

The auth service manages token lifecycle and caching:

```typescript
// Core functions
export async function getSupabaseClientToken(): Promise<string>; // Visitor token
export async function signInUser(
	email: string,
	password: string,
): Promise<string>; // User sign-in
export async function getCurrentAuthToken(): Promise<string>; // Smart token selection
export function signOutUser(): void; // Clear user session
export function isUserSignedIn(): boolean; // Check auth status
```

#### Token Selection Logic

The `getCurrentAuthToken()` function implements the switching logic:

1. **If user is signed in**: Return cached user token
2. **If user token expired**: Clear cache, fall back to visitor token
3. **If no user signed in**: Return visitor token

#### Supabase Client Creation

The `getSupabaseClientWithAuth()` function now:

1. Calls `getCurrentAuthToken()` to get appropriate token
2. Creates Supabase client with that token
3. Supports both visitor and user authentication seamlessly

## Usage Examples

### Basic Sign-In Flow

```typescript
import {
	getCurrentAuthToken,
	isUserSignedIn,
	signInUser,
} from "./services/auth";

// Sign in a user
try {
	await signInUser("user@example.com", "password");
	console.log("User signed in successfully");
} catch (error) {
	console.error("Sign in failed:", error);
}

// Check if signed in
if (isUserSignedIn()) {
	console.log("User is signed in");
}

// Get current token (automatically selects user or visitor)
const token = await getCurrentAuthToken();
```

### Using Supabase Client

```typescript
import { getSupabaseClientWithAuth } from "./supabaseClient";

// This will automatically use the correct token
const client = await getSupabaseClientWithAuth();

// Query will use user token if signed in, visitor token otherwise
const { data, error } = await client.from("songs").select("*");
```

### Component Example

```typescript
import { SignInForm } from './components/SignInForm';
import { AuthTokenDemo } from './examples/AuthTokenDemo';

function App() {
  return (
    <div>
      <SignInForm />
      <AuthTokenDemo />
    </div>
  );
}
```

## Security Considerations

### Token Storage

- **Client-side**: Tokens stored in memory only (not localStorage/cookies)
- **Server-side**: Tokens cached with expiration times
- **Automatic cleanup**: Expired tokens automatically removed

### Token Transitions

- When user signs in: Visitor token cleared, user token cached
- When user signs out: All tokens cleared
- On token expiry: Automatic refresh on next request

### RLS Policies

Row Level Security policies should handle both token types:

```sql
-- Example: Songs visible to owner or visitors
CREATE POLICY "songs_access_policy" ON songs
FOR SELECT USING (
  auth.uid() = user_id OR  -- User can see their own songs
  auth.jwt() ->> 'visitor_id' IS NOT NULL  -- Visitor can see public songs
);
```

## Implementation Notes

### Cache Management

- Visitor tokens: Single global cache
- User tokens: Per-user cache (Map keyed by email)
- Expiration: Both caches respect token expiry times

### Error Handling

- Network failures: Graceful fallback to cached tokens
- Authentication failures: Clear invalid tokens
- Token expiry: Automatic refresh attempts

### Testing

Use the `AuthTokenDemo` component to verify:

1. Visitor token is used when signed out
2. User token is used when signed in
3. Token switching happens automatically
4. Expiration and refresh work correctly

## Migration Guide

If upgrading from visitor-only authentication:

1. **Update imports**: Change from `getSupabaseClientToken` to `getCurrentAuthToken`
2. **Add sign-in UI**: Use `SignInForm` component or create custom
3. **Update RLS policies**: Ensure they handle both visitor and user tokens
4. **Test flows**: Verify both authenticated and anonymous user paths work

## Future Enhancements

Potential improvements:

1. **Refresh tokens**: Implement refresh token flow for longer sessions
2. **Role-based tokens**: Add role claims for permission management
3. **Multi-tenant**: Support organization-specific tokens
4. **Offline support**: Cache strategy for offline token validation
