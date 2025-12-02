export { isProvider } from "@/shared/providers";

// The API layer previously had its own copy of `isProvider`.
// Keep a re-exporting thin wrapper here to ensure any existing
// imports continue to work while standardizing on the shared implementation.

export { isProvider as default } from "@/shared/providers";
