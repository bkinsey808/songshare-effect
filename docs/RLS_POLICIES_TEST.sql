-- Test script to verify RLS policies work with both visitor and user tokens
-- Run these queries to test the different authentication scenarios

-- =======================
-- Test Setup Data
-- =======================

-- First, let's create some test data (run as service role)
-- This should be run with admin/service key privileges

-- Insert test user
INSERT INTO public."user" (user_id, name, email) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Test User 1', 'test1@example.com'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Test User 2', 'test2@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test user_public profiles
INSERT INTO public.user_public (user_id, username) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'testuser1'),
  ('550e8400-e29b-41d4-a716-446655440002', 'testuser2')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test songs (private)
INSERT INTO public.song (song_id, user_id, private_notes) 
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Private notes for song 1'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Private notes for song 2')
ON CONFLICT (song_id) DO NOTHING;

-- Insert test songs (public)
INSERT INTO public.song_public (song_id, user_id, song_name, song_slug, fields, slide_order, slides) 
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Test Song 1', 'test-song-1', '{}', '{}', '{}'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Test Song 2', 'test-song-2', '{}', '{}', '{}')
ON CONFLICT (song_id) DO NOTHING;

-- =======================
-- VISITOR TOKEN TESTS
-- =======================

-- Test visitor token access to public tables
-- These should work with visitor tokens (app_metadata.visitor_id present)

-- ✅ Should work: Visitor reading song_public
SELECT 'VISITOR - song_public read' as test, song_name, username 
FROM song_public sp 
JOIN user_public up ON sp.user_id = up.user_id;

-- ✅ Should work: Visitor reading user_public
SELECT 'VISITOR - user_public read' as test, username 
FROM user_public;

-- ❌ Should fail: Visitor trying to access private song table
-- This should return no rows due to RLS
SELECT 'VISITOR - song private read (should be empty)' as test, private_notes 
FROM song;

-- ❌ Should fail: Visitor trying to access private user table
-- This should return no rows due to RLS
SELECT 'VISITOR - user private read (should be empty)' as test, name, email 
FROM "user";

-- =======================
-- USER TOKEN TESTS
-- =======================

-- Test user token access (these tests assume user_id = '550e8400-e29b-41d4-a716-446655440001')
-- These should work with user tokens (auth.uid() returns user_id)

-- ✅ Should work: User reading song_public (all songs)
SELECT 'USER - song_public read (all)' as test, song_name, username 
FROM song_public sp 
JOIN user_public up ON sp.user_id = up.user_id;

-- ✅ Should work: User reading user_public (all users)
SELECT 'USER - user_public read (all)' as test, username 
FROM user_public;

-- ✅ Should work: User reading their own private song
-- This should return only the user's own songs
SELECT 'USER - own song private read' as test, private_notes 
FROM song 
WHERE user_id = auth.uid();

-- ✅ Should work: User reading their own private user data
-- This should return only their own user record
SELECT 'USER - own user private read' as test, name, email 
FROM "user" 
WHERE user_id = auth.uid();

-- ❌ Should fail: User trying to read other user's private data
-- This should return no rows due to RLS
SELECT 'USER - other user private read (should be empty)' as test, name, email 
FROM "user" 
WHERE user_id != auth.uid();

-- =======================
-- TOKEN VERIFICATION QUERIES
-- =======================

-- Use these to verify what claims are in your current token
SELECT 'Current auth.uid()' as info, auth.uid() as value
UNION ALL
SELECT 'JWT visitor_id claim', (auth.jwt() -> 'app_metadata' ->> 'visitor_id')
UNION ALL
SELECT 'JWT sub claim', (auth.jwt() ->> 'sub')
UNION ALL
SELECT 'JWT role claim', (auth.jwt() ->> 'role');

-- =======================
-- EXPECTED RESULTS
-- =======================

/*
VISITOR TOKEN (app_metadata.visitor_id present):
- ✅ Can read song_public (all songs)
- ✅ Can read user_public (all profiles)  
- ❌ Cannot read song (private) - returns empty
- ❌ Cannot read user (private) - returns empty

USER TOKEN (auth.uid() returns user_id):
- ✅ Can read song_public (all songs)
- ✅ Can read user_public (all profiles)
- ✅ Can read song (only own songs)
- ✅ Can read user (only own data)
- ✅ Can insert/update/delete own data in all tables
- ❌ Cannot read other users' private data

NO TOKEN (anonymous):
- ❌ All queries should fail or return empty due to RLS
*/