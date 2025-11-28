// Prefer per-line console exceptions
import { useEffect, useRef } from "react";
import { type StoreApi } from "zustand";

import { ensureSignedIn } from "@/react/auth/ensureSignedIn";
import { clientDebug } from "@/react/utils/clientLogger";
import { type AppSlice, getStoreApi } from "@/react/zustand/useAppStore";

export default function useEnsureSignedIn(options?: {
	readonly force?: boolean;
}): void {
	const force = options?.force ?? false;
	const storeApiRef = useRef<StoreApi<AppSlice> | undefined>(undefined);

	useEffect(() => {
		if (!storeApiRef.current) {
			storeApiRef.current = getStoreApi();
		}
		// Localized debug-only log
		clientDebug("[useEnsureSignedIn] effect mounted, force=", force);
		void ensureSignedIn({ force });
	}, [force]);
}
