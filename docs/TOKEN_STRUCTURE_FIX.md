# Token Structure Fix for RLS Policies

## 🔧 **Problem Solved**

Instead of modifying the SQL schema, I've updated the token generation to create JWTs that match the existing RLS policy expectations.

## 🔍 **Existing RLS Policy Structure**

The current database policies expect these JWT claim structures:

### **Visitor Tokens**

```sql
-- Policy checks for:
(auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
```

**Expected JWT structure:**

```json
{
	"sub": "visitor-user-uuid",
	"app_metadata": {
		"visitor_id": "visitor-user-uuid"
	}
}
```

### **User Tokens**

```sql
-- Policy checks for:
(auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL
```

**Expected JWT structure:**

```json
{
	"sub": "user-uuid",
	"app_metadata": {
		"user": {
			"user_id": "user-uuid"
		}
	}
}
```

## ✅ **Solution Implemented**

### **Updated `getSupabaseUserToken()` Function**

The function now ensures user tokens have the correct `app_metadata` structure:

```typescript
// Ensure the user has the correct app_metadata structure for RLS policies
// The policies expect: app_metadata.user.user_id
const expectedMetadata = {
	...data.user.app_metadata,
	user: { user_id: data.user.id },
};

// Check if we need to update the user's metadata
const currentUserData = data.user.app_metadata?.user?.user_id as
	| string
	| undefined;
if (currentUserData !== data.user.id) {
	// Update user metadata and re-authenticate to get fresh token
	await client.auth.admin.updateUserById(data.user.id, {
		app_metadata: expectedMetadata,
	});

	// Sign in again to get token with updated claims
	data = await client.auth.signInWithPassword({ email, password });
}
```

### **Visitor Token (Already Working)**

The `getSupabaseClientToken()` function already creates visitor tokens with the correct structure:

- Sets `app_metadata.visitor_id` to the visitor user's ID
- RLS policies recognize this and grant access to `*_public` tables

## 🎯 **How It Works**

### **Token Generation Flow**

1. **Visitor Authentication**:
   - Uses shared visitor account credentials
   - Ensures `app_metadata.visitor_id` is set
   - Token cached and reused until expiry

2. **User Authentication**:
   - User signs in with their credentials
   - Function checks if `app_metadata.user.user_id` exists
   - If missing, updates user metadata and re-authenticates
   - Returns token with correct claim structure

### **RLS Policy Matching**

The existing policies will now work correctly:

**For `*_public` tables:**

```sql
-- This will match visitor tokens
((auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL)
OR
-- This will match user tokens
((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id') IS NOT NULL)
```

**For private tables:**

```sql
-- This will match user's own data
user_id = ((auth.jwt() -> 'app_metadata' -> 'user' ->> 'user_id'))::uuid
```

## 🧪 **Testing**

Use the test utility to verify token structures:

```typescript
import { runTokenTests } from "./docs/test-token-structure";

// This will decode and verify both token types
await runTokenTests();
```

## 📋 **Expected Behavior**

### **Visitor Mode**

- Gets visitor token with `app_metadata.visitor_id`
- Can read `song_public` and `user_public` tables
- Cannot access `song` or `user` tables (RLS blocks)

### **User Mode**

- Gets user token with `app_metadata.user.user_id`
- Can read all `*_public` tables
- Can access own records in `song` and `user` tables
- Cannot access other users' private data (RLS blocks)

## ✨ **Benefits**

1. **No SQL Changes**: Works with existing database schema
2. **Backward Compatible**: Existing visitor tokens continue working
3. **Automatic**: Users don't need to do anything special
4. **Secure**: RLS policies enforce proper data isolation
5. **Self-Correcting**: Metadata automatically added on first sign-in

The token generation now creates JWTs that perfectly match your existing RLS policy expectations, ensuring seamless authentication for both visitor and user modes!
