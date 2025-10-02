# Database Schema Review: Token Authentication Analysis

## 🔍 **Schema Analysis Results**

I've reviewed the database schema and identified several issues with the current RLS policies that need to be fixed for proper visitor and user token authentication.

## 📋 **Current Schema Structure**

### Tables:

- **`song`** - Private song data (notes, metadata)
- **`song_public`** - Public song data (name, slides, etc.)
- **`user`** - Private user data (email, settings, etc.)
- **`user_public`** - Public user profiles (username)

### Access Pattern:

- **Visitors**: Should read `*_public` tables only
- **Users**: Should read all tables, but private tables only for their own data

## ❌ **Issues Found**

### 1. **Incorrect JWT Claim Paths**

```sql
-- WRONG: Current policy structure
((((auth.jwt() -> 'app_metadata'::text) -> 'user'::text) ->> 'user_id'::text) IS NOT NULL)

-- CORRECT: Standard Supabase JWT structure
auth.uid() IS NOT NULL  -- for user tokens
```

### 2. **Missing Policies**

- `song` table has RLS enabled but no access policies
- No INSERT/UPDATE/DELETE policies for users
- Inconsistent policy naming

### 3. **Token Structure Mismatch**

- **Visitor tokens**: `app_metadata.visitor_id` ✅ (correctly implemented)
- **User tokens**: Standard Supabase JWTs with `sub` claim ✅ (but policies expect wrong structure)

## ✅ **Solution Implemented**

### Updated RLS Policies:

#### **Visitor Token Policies** (Read-only access to public tables)

```sql
-- Visitors can read all public songs
CREATE POLICY "song_public_visitor_read" ON public.song_public
FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL);

-- Visitors can read all public user profiles
CREATE POLICY "user_public_visitor_read" ON public.user_public
FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL);
```

#### **User Token Policies** (Full CRUD access to own data)

```sql
-- Users can read all public songs
CREATE POLICY "song_public_user_read" ON public.song_public
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Users can only access their own private data
CREATE POLICY "song_user_read" ON public.song
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Similar policies for INSERT/UPDATE/DELETE operations
```

## 🔒 **Security Model**

### **Visitor Tokens (Anonymous Users)**

- **JWT Structure**: `{ app_metadata: { visitor_id: "uuid" } }`
- **Access Level**: Read-only access to `*_public` tables
- **Use Case**: Browse public songs, view user profiles
- **Security**: Shares visitor user account, no private data access

### **User Tokens (Authenticated Users)**

- **JWT Structure**: Standard Supabase token with `sub: user_id`
- **Access Level**: Full CRUD on own data, read access to public data
- **Use Case**: Manage personal songs, access private notes
- **Security**: Individual user account, RLS enforces data isolation

## 📁 **Files Created**

1. **`docs/RLS_POLICIES_UPDATE.sql`** - Complete policy updates
2. **`docs/RLS_POLICIES_TEST.sql`** - Test queries to verify functionality
3. **`docs/USER_AUTHENTICATION.md`** - Full authentication guide

## 🚀 **Next Steps**

1. **Apply the SQL updates**:

   ```bash
   # Run the policy updates in Supabase dashboard or via CLI
   supabase db reset  # or apply RLS_POLICIES_UPDATE.sql
   ```

2. **Test the policies**:

   ```bash
   # Use RLS_POLICIES_TEST.sql to verify both token types work
   ```

3. **Verify in application**:
   - Test visitor mode browsing
   - Test user sign-in and private data access
   - Confirm proper token switching

## 🎯 **Expected Behavior**

### **As Visitor** (using visitor token):

```typescript
const client = await getSupabaseClientWithAuth(); // Gets visitor token
const { data } = await client.from('song_public').select('*'); // ✅ Works
const { data } = await client.from('song').select('*'); // ❌ Returns empty (RLS blocks)
```

### **As User** (after sign-in):

```typescript
await signInUser('user@example.com', 'password'); // Gets user token
const client = await getSupabaseClientWithAuth(); // Uses user token
const { data } = await client.from('song_public').select('*'); // ✅ Works (all songs)
const { data } = await client.from('song').select('*'); // ✅ Works (own songs only)
```

The updated schema will now properly support both visitor and user authentication modes with appropriate data access restrictions.
