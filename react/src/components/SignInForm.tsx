import { useState } from "react";

import { isUserSignedIn, signInUser, signOutUser } from "../services/auth";

export function SignInForm(): ReactElement {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [isSignedIn, setIsSignedIn] = useState(isUserSignedIn());

	const handleSignIn = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setIsLoading(true);
		setError(undefined);

		try {
			await signInUser(email, password);
			setIsSignedIn(true);
			setEmail("");
			setPassword("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign in failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignOut = (): void => {
		signOutUser();
		setIsSignedIn(false);
	};

	if (isSignedIn) {
		return (
			<div className="sign-in-form">
				<p>✅ You are signed in!</p>
				<button type="button" onClick={handleSignOut}>
					Sign Out
				</button>
			</div>
		);
	}

	return (
		<form className="sign-in-form" onSubmit={handleSignIn}>
			<h3>Sign In</h3>
			{error !== undefined && (
				<div className="error" style={{ color: "red", marginBottom: "1rem" }}>
					{error}
				</div>
			)}
			<div>
				<label htmlFor="email">Email:</label>
				<input
					type="email"
					id="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isLoading}
				/>
			</div>
			<div>
				<label htmlFor="password">Password:</label>
				<input
					type="password"
					id="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					disabled={isLoading}
				/>
			</div>
			<button type="submit" disabled={isLoading}>
				{isLoading ? "Signing in..." : "Sign In"}
			</button>
			<p style={{ fontSize: "0.8rem", color: "#666", marginTop: "1rem" }}>
				When signed out, you'll use a shared visitor token. When signed in,
				you'll have a user-specific token with access to your personal data.
			</p>
		</form>
	);
}
