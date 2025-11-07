import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import fs from "fs";
import path from "path";
import { type ServerOptions, type UserConfig, defineConfig } from "vite";

// https://vite.dev/config/
const config: UserConfig = defineConfig({
	root: ".",
	plugins: [
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
			plugins: [tailwindcss, autoprefixer],
		},
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
			host: "127.0.0.1",
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

		// Enable HTTPS if mkcert-generated certs are present in .certs/
		try {
			const certPath = path.resolve(__dirname, ".certs/localhost.pem");
			const keyPath = path.resolve(__dirname, ".certs/localhost-key.pem");
			if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
				return {
					...base,
					https: {
						cert: fs.readFileSync(certPath),
						key: fs.readFileSync(keyPath),
					},
				};
			}
		} catch (err) {
			// If anything fails, fall back to non-https dev server.
			// We intentionally swallow errors here to avoid blocking dev startup.
			const msg = err instanceof Error ? err.message : String(err);
			console.warn("Could not enable HTTPS for Vite dev server:", msg);
		}

		return base;
	})(),
});

export default config;
