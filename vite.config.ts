/* eslint-disable @typescript-eslint/naming-convention */
import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import path from "path";
import { type UserConfig, defineConfig } from "vite";
import fs from "fs";

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
		const base = {
			host: "localhost",
			port: 5173,
			strictPort: true,
			proxy: {
				"/api": {
					target: "http://localhost:8787",
					changeOrigin: true,
					secure: false,
					// Ensure Set-Cookie headers from the backend are forwarded to the
					// browser in development. Many dev proxies rewrite or drop cookie
					// domains; cookieDomainRewrite forces cookies to be usable on
					// localhost during local testing.
					cookieDomainRewrite: {
						"localhost": "localhost",
						"127.0.0.1": "localhost",
					}, 
					// Keep verbose proxy logs in dev to help debugging captured traffic
					logLevel: "debug",
				},
			},
		} as any;

		// Enable HTTPS if mkcert-generated certs are present in .certs/
		try {
			const certPath = path.resolve(__dirname, ".certs/localhost.pem");
			const keyPath = path.resolve(__dirname, ".certs/localhost-key.pem");
			if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
				return { ...base, https: { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) } };
			}
		} catch (err) {
			// If anything fails, fall back to non-https dev server.
			// We intentionally swallow errors here to avoid blocking dev startup.
			console.warn("Could not enable HTTPS for Vite dev server:", err && (err as Error).message);
		}

		return base;
	})(),
});

export default config;
