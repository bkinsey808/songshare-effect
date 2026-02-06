// Ambient module declarations for the project's `@/...` path aliases.
// These provide a minimal (unknown) typing so the TS server can resolve imports
// without requiring `baseUrl` to be present in every tsconfig (see oxc/tsgolint).
// Keeping these declarations live in `types/paths.d.ts` ensures editor tooling
// still understands the aliases after removing `baseUrl` per the linting requirements.

declare module "@/react/*" {
	const whatever: unknown;
	export default whatever;
}

declare module "@/shared/*" {
	const whatever: unknown;
	export default whatever;
}

declare module "@/api/*" {
	const whatever: unknown;
	export default whatever;
}

export type __PathsMarker = unknown;
