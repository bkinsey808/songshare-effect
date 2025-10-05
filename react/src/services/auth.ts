// All Supabase authentication logic has been moved to ../supabase/getSupabaseAuthToken.ts
// This file now re-exports those functions for backward compatibility

export {
	getSupabaseAuthToken,
	getSupabaseClientToken,
	clearSupabaseClientToken,
	signInUser,
	signOutUser,
	isUserSignedIn,
} from "../supabase/getSupabaseAuthToken";
