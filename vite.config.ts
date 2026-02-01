// Use the Tailwind PostCSS plugin package rather than importing Tailwind's
// runtime directly. Tailwind's PostCSS plugin was moved to a separate
// package (`@tailwindcss/postcss`) so import that here for PostCSS usage.
import tailwindPostcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import typeGPU from "unplugin-typegpu/vite";
import { type ServerOptions, type UserConfig, defineConfig } from "vite";

// Use a local helper here to avoid importing project source files that use
// TS path aliases (e.g. "@/shared/...") which Node may not resolve when
// loading `vite.config.ts` directly.
function extractErrorMessageLocal(err: unknown, fallback = "Unknown error"): string {
	try {
		if (err instanceof Error) {
			return err.stack ?? err.message ?? fallback;
		}
		if (typeof err === "string") {
			return err;
		}
		return JSON.stringify(err ?? fallback);
	} catch {
		return fallback;
	}
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
const config: UserConfig = defineConfig({
	root: ".",
	plugins: [
		typeGPU({}),
		react({
			babel: {
				plugins: [
					[
						"babel-plugin-react-compiler",
						{
							// React Compiler configuration
							compilationMode: "infer",
							panicThreshold: "all_errors",
						},
					],
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@/react": path.resolve(__dirname, "./react/src"),
			"@/shared": path.resolve(__dirname, "./shared/src"),
			"@/api": path.resolve(__dirname, "./api/src"),
		},
	},
	css: {
		postcss: {
			plugins: [tailwindPostcss, autoprefixer],
		},
	},
	build: {
		// Ensure proper cache busting with content-based hashing
		rollupOptions: {
			output: {
				// Use content-based hashes for all assets
				entryFileNames: "assets/[name].[hash].js",
				chunkFileNames: "assets/[name].[hash].js",
				assetFileNames: "assets/[name].[hash].[ext]",
				// Manual chunks for better caching and smaller initial bundle
				manualChunks(id: string): string | undefined {
					// React core - changes infrequently, good for caching
					if (
						id.includes("node_modules/react") ||
						id.includes("node_modules/react-dom") ||
						id.includes("node_modules/react-router")
					) {
						return "react-vendor";
					}
					// Effect library - large, used across app
					if (id.includes("node_modules/effect")) {
						return "effect";
					}
					// State management
					if (id.includes("node_modules/zustand")) {
						return "zustand";
					}
					return undefined;
				},
			},
		},
		// Generate source maps for better debugging in production
		sourcemap: true,
		// Ensure assets are properly fingerprinted
		assetsInlineLimit: 0,
	},

	// Development server proxy to forward API requests to the
	// local API dev server (wrangler). This keeps client code using
	// absolute paths like `/api/me` and avoids CORS during local dev.
	server: (() => {
		// Base local server config
		const base: ServerOptions = {
			// Bind explicitly to IPv4 localhost to avoid test probes resolving
			// to IPv6 (::1) on some systems which can cause connection refused
			// races when Playwright probes 127.0.0.1.
			host: "localhost",
			port: 5173,
			strictPort: true,
			proxy: {
				"/api": {
					target: "http://localhost:8787",
					// Important: preserve the browser "Origin" header so the API sees the
					// front-end origin (https://localhost:5173). When changeOrigin is
					// true proxies often rewrite the Origin/Host to the target which can
					// cause OAuth redirect_uri to be built using the backend port (e.g.
					// http://localhost:8787) and lead to redirect_uri_mismatch errors.
					changeOrigin: false,
					secure: false,
					// Ensure Set-Cookie headers from the backend are forwarded to the
					// browser in development. Many dev proxies rewrite or drop cookie
					// domains; cookieDomainRewrite forces cookies to be usable on
					// localhost during local testing.
					cookieDomainRewrite: {
						localhost: "localhost",
						"127.0.0.1": "localhost",
					},
					// Keep verbose proxy logs in dev to help debugging captured traffic
					// (Note: `logLevel` is not part of Vite's typed ProxyOptions and
					// was removed to satisfy the TypeScript config. Use runtime
					// logging or the proxy server's own logs for verbose output.)
				},
			},
		};

		// Allow opt-out of HTTPS when Playwright attempts to start our dev
		// server automatically. Playwright's webServer readiness check uses
		// Node's HTTP client and will not ignore self-signed certificates.
		// To make auto-start reliable we support honoring the
		// `PLAYWRIGHT_DISABLE_HTTPS` env var which forces the dev server to
		// run over plain HTTP when set. This keeps the default HTTPS dev
		// experience for manual local dev where mkcert certs are present.
		//
		// When Playwright starts the server it will set PLAYWRIGHT_DISABLE_HTTPS=1
		// so the dev server comes up on http://127.0.0.1:5173 and Playwright can
		// probe it successfully.
		// Enable HTTPS if mkcert-generated certs are present in .certs/
		try {
			const certPath = path.resolve(__dirname, ".certs/localhost.pem");
			const keyPath = path.resolve(__dirname, ".certs/localhost-key.pem");
			// If PLAYWRIGHT_DISABLE_HTTPS is truthy we intentionally skip
			// enabling HTTPS so external probes (Playwright's webServer) can
			// use plain HTTP when validating readiness.
			// Respect string values ('1' or 'true') and avoid treating an
			// empty string or undefined as truthy. This satisfies the
			// strict-boolean-expressions lint rule.
			const playwrightDisableHttpsEnv = process.env["PLAYWRIGHT_DISABLE_HTTPS"];
			const playwrightDisableHttps =
				typeof playwrightDisableHttpsEnv === "string" &&
				playwrightDisableHttpsEnv !== "" &&
				["1", "true"].includes(playwrightDisableHttpsEnv.toLowerCase());

			if (playwrightDisableHttps) {
				return base;
			}

			if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
				return {
					...base,
					https: {
						cert: fs.readFileSync(certPath),
						key: fs.readFileSync(keyPath),
					},
				};
			}
		} catch (error) {
			// If anything fails, fall back to non-https dev server.
			// We intentionally swallow errors here to avoid blocking dev startup.
			const msg = extractErrorMessageLocal(error, "Unknown error");
			console.warn("Could not enable HTTPS for Vite dev server:", msg);
		}

		return base;
	})(),
});

export default config;
