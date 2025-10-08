#!/usr/bin/env bun
/* eslint-disable no-console */
import { safeGet } from "@/shared/utils/safe";

/**
 * Gets an environment variable value safely, returning undefined if not found.
 * @param envVar - The environment variable name
 * @returns The environment variable value as a string, or undefined if not found/empty
 */
const getEnvValueSafe = (envVar: string): string | undefined => {
	// eslint-disable-next-line no-process-env
	const value = safeGet(process.env, envVar) as string | undefined;
	return typeof value === "string" && value.trim() !== "" ? value : undefined;
};

/**
 * Keep-alive script to prevent Supabase project from pausing
 * This script makes a simple API call to keep the project active
 */
const keepAlive = async (): Promise<void> => {
	try {
		const supabaseUrl = getEnvValueSafe("VITE_SUPABASE_URL");
		const supabaseKey = getEnvValueSafe("VITE_SUPABASE_ANON_KEY");

		if (
			supabaseUrl?.trim() === "" ||
			supabaseUrl === undefined ||
			supabaseKey?.trim() === "" ||
			supabaseKey === undefined
		) {
			console.error("❌ Missing Supabase credentials in environment");
			process.exit(1);
		}

		console.log("🏓 Pinging Supabase to keep project active...");

		// Simple REST API health check
		const response = await fetch(`${supabaseUrl}/rest/v1/`, {
			headers: {
				// cspell:disable-next-line
				apikey: supabaseKey,
				Authorization: `Bearer ${supabaseKey}`,
			},
		});

		if (response.ok) {
			console.log("✅ Supabase project is active");
		} else {
			console.log(`⚠️  Supabase responded with status: ${response.status}`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("❌ Failed to ping Supabase:", errorMessage);
	}
};

if (import.meta.main) {
	void keepAlive();
}
