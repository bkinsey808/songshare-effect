/**
 * Test utility to verify JWT token structures match RLS policy expectations
 * This helps ensure our token generation creates the correct claims structure
 */
import {
	getSupabaseClientToken,
	getSupabaseUserToken,
} from "../api/src/supabaseClientToken";

// Mock environment for testing
const testEnv = {
	VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "",
	SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || "",
	SUPABASE_VISITOR_EMAIL: process.env.SUPABASE_VISITOR_EMAIL || "",
	SUPABASE_VISITOR_PASSWORD: process.env.SUPABASE_VISITOR_PASSWORD || "",
};

type JWTPayload = {
	sub: string;
	app_metadata?: {
		visitor_id?: string;
		user?: {
			user_id: string;
		};
	};
	[key: string]: unknown;
};

/**
 * Decode JWT token to inspect its claims (for testing only)
 */
function decodeJWT(token: string): JWTPayload | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) throw new Error("Invalid JWT format");

		const payload = parts[1];
		const decoded = JSON.parse(
			atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
		);
		return decoded;
	} catch (error) {
		console.error("Failed to decode JWT:", error);
		return null;
	}
}

/**
 * Test visitor token structure
 */
export async function testVisitorToken(): Promise<void> {
	console.log("\n🤖 Testing Visitor Token Structure...");

	try {
		const visitorToken = await getSupabaseClientToken(testEnv);
		const decoded = decodeJWT(visitorToken);

		if (!decoded) {
			console.error("❌ Failed to decode visitor token");
			return;
		}

		console.log("Visitor token claims:");
		console.log("- sub:", decoded.sub);
		console.log("- app_metadata.visitor_id:", decoded.app_metadata?.visitor_id);

		// Verify expected structure for RLS policies
		if (decoded.app_metadata?.visitor_id) {
			console.log("✅ Visitor token has correct structure for RLS policies");
		} else {
			console.log("❌ Visitor token missing required app_metadata.visitor_id");
		}
	} catch (error) {
		console.error("❌ Error testing visitor token:", error);
	}
}

/**
 * Test user token structure
 */
export async function testUserToken(
	email: string,
	password: string,
): Promise<void> {
	console.log("\n👤 Testing User Token Structure...");

	try {
		const userToken = await getSupabaseUserToken(testEnv, email, password);
		const decoded = decodeJWT(userToken);

		if (!decoded) {
			console.error("❌ Failed to decode user token");
			return;
		}

		console.log("User token claims:");
		console.log("- sub:", decoded.sub);
		console.log(
			"- app_metadata.user.user_id:",
			decoded.app_metadata?.user?.user_id,
		);

		// Verify expected structure for RLS policies
		if (decoded.app_metadata?.user?.user_id) {
			console.log("✅ User token has correct structure for RLS policies");

			// Verify the user_id matches the sub claim
			if (decoded.app_metadata.user.user_id === decoded.sub) {
				console.log("✅ app_metadata.user.user_id matches sub claim");
			} else {
				console.log("❌ app_metadata.user.user_id does not match sub claim");
			}
		} else {
			console.log("❌ User token missing required app_metadata.user.user_id");
		}
	} catch (error) {
		console.error("❌ Error testing user token:", error);
	}
}

/**
 * Run all token structure tests
 */
export async function runTokenTests(): Promise<void> {
	console.log("🔐 JWT Token Structure Tests");
	console.log("============================");

	await testVisitorToken();

	// Note: Replace with actual test user credentials
	const testUserEmail = "test@example.com";
	const testUserPassword = "password123";

	console.log(`\nTesting with user: ${testUserEmail}`);
	await testUserToken(testUserEmail, testUserPassword);

	console.log("\n📋 Expected RLS Policy Behavior:");
	console.log(
		"- Visitor tokens: Can read *_public tables via app_metadata.visitor_id",
	);
	console.log(
		"- User tokens: Can access own data via app_metadata.user.user_id",
	);
}

// Run tests if this file is executed directly
if (require.main === module) {
	runTokenTests().catch(console.error);
}
