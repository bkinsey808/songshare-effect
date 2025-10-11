/* eslint-disable @typescript-eslint/naming-convention */
import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import path from "path";
import { type UserConfig, defineConfig } from "vite";

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
});

export default config;
