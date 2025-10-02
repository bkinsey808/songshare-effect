-- Fix RLS policies for visitor and user token authentication
-- This script updates the existing policies to work with both token types

-- Drop existing policies to recreate them with correct logic
DROP POLICY IF EXISTS "Allow read access to song_public for visitors or users" ON public.song_public;
DROP POLICY IF EXISTS "Allow read access to user_public for visitors or users" ON public.user_public;
DROP POLICY IF EXISTS "Allow read for matching user_id" ON public.song;

-- Enable RLS on song table (it was enabled but had no policies)
ALTER TABLE public.song ENABLE ROW LEVEL SECURITY;

-- =======================
-- VISITOR TOKEN POLICIES
-- =======================
-- Visitor tokens have visitor_id in app_metadata.visitor_id
-- These policies allow read access to public tables for visitors

-- song_public: Allow visitors to read all public songs
CREATE POLICY "song_public_visitor_read" ON public.song_public
FOR SELECT TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
);

-- user_public: Allow visitors to read all public user info
CREATE POLICY "user_public_visitor_read" ON public.user_public
FOR SELECT TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'visitor_id') IS NOT NULL
);

-- =======================
-- USER TOKEN POLICIES
-- =======================
-- User tokens are standard Supabase JWTs with user_id in the 'sub' claim
-- These policies provide full access to user's own data and read access to public data

-- song_public: Allow users to read all public songs
CREATE POLICY "song_public_user_read" ON public.song_public
FOR SELECT TO authenticated 
USING (
  auth.uid() IS NOT NULL
);

-- song_public: Allow users to insert their own songs
CREATE POLICY "song_public_user_insert" ON public.song_public
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = user_id
);

-- song_public: Allow users to update their own songs
CREATE POLICY "song_public_user_update" ON public.song_public
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- song_public: Allow users to delete their own songs
CREATE POLICY "song_public_user_delete" ON public.song_public
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- user_public: Allow users to read all public user info
CREATE POLICY "user_public_user_read" ON public.user_public
FOR SELECT TO authenticated 
USING (
  auth.uid() IS NOT NULL
);

-- user_public: Allow users to insert their own public profile
CREATE POLICY "user_public_user_insert" ON public.user_public
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = user_id
);

-- user_public: Allow users to update their own public profile
CREATE POLICY "user_public_user_update" ON public.user_public
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_public: Allow users to delete their own public profile
CREATE POLICY "user_public_user_delete" ON public.user_public
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- =======================
-- PRIVATE TABLE POLICIES
-- =======================
-- Private tables (song, user) are only accessible to authenticated users for their own data

-- song: Allow users to read their own private song data
CREATE POLICY "song_user_read" ON public.song
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- song: Allow users to insert their own private song data
CREATE POLICY "song_user_insert" ON public.song
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- song: Allow users to update their own private song data
CREATE POLICY "song_user_update" ON public.song
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- song: Allow users to delete their own private song data
CREATE POLICY "song_user_delete" ON public.song
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- user: Allow users to read their own private user data
CREATE POLICY "user_user_read" ON public."user"
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- user: Allow users to update their own private user data
CREATE POLICY "user_user_update" ON public."user"
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user: Allow users to delete their own private user data
CREATE POLICY "user_user_delete" ON public."user"
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- =======================
-- POLICY DOCUMENTATION
-- =======================

COMMENT ON POLICY "song_public_visitor_read" ON public.song_public IS 
'Allows visitor tokens (with visitor_id in app_metadata) to read all public songs';

COMMENT ON POLICY "user_public_visitor_read" ON public.user_public IS 
'Allows visitor tokens (with visitor_id in app_metadata) to read all public user profiles';

COMMENT ON POLICY "song_public_user_read" ON public.song_public IS 
'Allows authenticated users to read all public songs';

COMMENT ON POLICY "song_user_read" ON public.song IS 
'Allows authenticated users to read only their own private song data';

COMMENT ON POLICY "user_user_read" ON public."user" IS 
'Allows authenticated users to read only their own private user data';