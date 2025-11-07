#!/usr/bin/env bun
/* eslint-disable no-console, sonarjs/os-command, sonarjs/slow-regex, sonarjs/no-os-command-from-path, sonarjs/no-ignored-exceptions */
/**
 * Script to convert relative imports to path aliases
 * - @/shared -> shared/src
 * - @/react -> react/src
 * - @/api -> api/src
 */
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

function findAllTsFiles(pattern: string): string[] {
	try {
		const output = execSync(`find . -name "${pattern}" -type f`, {
			encoding: "utf-8",
			cwd: process.cwd(),
		});
		return output
			.trim()
			.split("\n")
			.filter(
				(file) =>
					file &&
					!file.includes("node_modules") &&
					!file.includes("dist") &&
					!file.includes(".git") &&
					!file.includes("temp-"),
			);
	} catch (_error) {
		console.error(`Error finding files with pattern ${pattern}:`, _error);
		return [];
	}
}

function convertApiImports(filePath: string, content: string): string {
	if (!filePath.includes("api/src/")) {
		return content;
	}

	// Convert relative imports within API to use @/api alias
	let updatedContent = content;

	// Pattern for ../something -> @/api/something
	updatedContent = updatedContent.replace(
		/import\s+([^'"]*)\s+from\s+["']\.\.\/([^'"]*?)["'];?/g,
		(match, importPart, relativePath) => {
			// Don't convert if it's already an alias or going to shared
			if (
				relativePath.includes("shared/src") ||
				relativePath.startsWith("@/")
			) {
				return match;
			}
			return `import ${importPart} from "@/api/${relativePath}";`;
		},
	);

	// Pattern for ./something -> @/api/currentDir/something
	const currentDir =
		filePath.split("api/src/")[1]?.split("/").slice(0, -1).join("/") || "";
	if (currentDir) {
		updatedContent = updatedContent.replace(
			/import\s+([^'"]*)\s+from\s+["']\.\/([^'"]*?)["'];?/g,
			(match, importPart, relativePath) => {
				if (relativePath.startsWith("@/")) {
					return match;
				}
				return `import ${importPart} from "@/api/${currentDir}/${relativePath}";`;
			},
		);
	}

	return updatedContent;
}

function convertReactImports(filePath: string, content: string): string {
	if (!filePath.includes("react/src/")) {
		return content;
	}

	let updatedContent = content;

	// Convert ../.. patterns in React files to @/react
	updatedContent = updatedContent.replace(
		/import\s+([^'"]*)\s+from\s+["'](\.\.\/)+([^'"]*?)["'];?/g,
		(match, importPart, _dots, relativePath) => {
			// Skip if already using aliases
			if (relativePath.startsWith("@/")) {
				return match;
			}

			// Skip external modules or shared imports that might not be in react/src
			if (
				relativePath.includes("node_modules") ||
				relativePath.includes("shared")
			) {
				return match;
			}

			return `import ${importPart} from "@/react/${relativePath}";`;
		},
	);

	return updatedContent;
}

function convertSharedImports(content: string): string {
	// Convert any remaining ../shared/src patterns to @/shared
	return content.replace(
		/from\s+["'][^"']*\/shared\/src\/([^"']*?)["'];?/g,
		'from "@/shared/$1";',
	);
}

function updateFileImports(filePath: string): boolean {
	try {
		const content = readFileSync(filePath, "utf-8");
		let updatedContent = content;

		// Apply conversions
		updatedContent = convertApiImports(filePath, updatedContent);
		updatedContent = convertReactImports(filePath, updatedContent);
		updatedContent = convertSharedImports(updatedContent);

		// Only write if content changed
		if (updatedContent !== content) {
			writeFileSync(filePath, updatedContent, "utf-8");
			console.log(`✅ Updated: ${filePath}`);
			return true;
		}

		return false;
	} catch (_error) {
		console.error(`❌ Error updating ${filePath}:`, _error);
		return false;
	}
}

async function main(): Promise<void> {
	console.log("🔄 Finding TypeScript and React files...");

	const patterns = ["*.ts", "*.tsx"];
	const allFiles: string[] = [];

	for (const pattern of patterns) {
		const files = findAllTsFiles(pattern);
		allFiles.push(...files);
	}

	console.log(`📁 Found ${allFiles.length} files to process`);

	let updatedCount = 0;

	for (const file of allFiles) {
		if (updateFileImports(file)) {
			updatedCount++;
		}
	}

	console.log(`🎉 Updated ${updatedCount} files with new import paths`);

	// Run build to test
	console.log("🧪 Testing build with updated imports...");
	try {
		execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
		console.log("✅ Build successful! All imports converted correctly.");
	} catch (_error) {
		console.error("❌ Build failed. Please check the imports manually.");
		process.exit(1);
	}
}

if (import.meta.main) {
	void main();
}
