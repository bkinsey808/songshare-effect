import { useEffect, useState } from "react";

import { SignInForm } from "../components/SignInForm";
import { isUserSignedIn } from "../services/auth";
import { getSupabaseClientWithAuth } from "../supabaseClient";

export function AuthTokenDemo(): React.ReactElement {
	const [tokenInfo, setTokenInfo] = useState<string>("Loading...");
	const [userSignedIn, setUserSignedIn] = useState(isUserSignedIn());

	const checkTokenInfo = async (): Promise<void> => {
		try {
			const client = await getSupabaseClientWithAuth();
			if (client === undefined) {
				setTokenInfo("❌ Failed to get Supabase client");
				return;
			}

			// Try to get current user info from the token
			const { data: user, error } = await client.auth.getUser();

			if (error) {
				setTokenInfo(`❌ Error getting user: ${error.message}`);
				return;
			}

			if (user.user === null) {
				setTokenInfo("🤖 Using visitor token (shared anonymous access)");
			} else {
				setTokenInfo(
					`👤 Using user token for: ${user.user.email ?? "Unknown user"}`,
				);
			}
		} catch (error) {
			setTokenInfo(
				`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	useEffect(() => {
		void checkTokenInfo();

		// Check every 2 seconds to show token changes
		const interval = setInterval(() => {
			setUserSignedIn(isUserSignedIn());
			void checkTokenInfo();
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
		>
			<h2>Authentication Token Demo</h2>

			<div style={{ marginBottom: "1rem" }}>
				<strong>Current Token Status:</strong>
				<div
					style={{
						padding: "0.5rem",
						backgroundColor: "#f5f5f5",
						borderRadius: "4px",
						fontFamily: "monospace",
						marginTop: "0.5rem",
					}}
				>
					{tokenInfo}
				</div>
			</div>

			<div style={{ marginBottom: "1rem" }}>
				<strong>Signed In Status:</strong> {userSignedIn ? "✅ Yes" : "❌ No"}
			</div>

			<SignInForm />

			<div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
				<strong>How it works:</strong>
				<ul>
					<li>
						<strong>Visitor Mode:</strong> Uses a shared JWT token for the
						visitor user, allowing access to public data and visitor-specific
						records via RLS policies.
					</li>
					<li>
						<strong>User Mode:</strong> After sign-in, uses the user's personal
						JWT token, providing access to their private data and user-specific
						records.
					</li>
					<li>
						<strong>Automatic Switching:</strong> The `getCurrentAuthToken()`
						function automatically returns the user token if signed in,
						otherwise the visitor token.
					</li>
				</ul>
			</div>
		</div>
	);
}
