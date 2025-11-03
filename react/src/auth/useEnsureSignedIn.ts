/* eslint-disable no-console */
import { useEffect, useRef } from "react";
import type { StoreApi } from "zustand";

import { ensureSignedIn } from "@/react/auth/ensureSignedIn";
import { type AppSlice, getStoreApi } from "@/react/zustand/useAppStore";

export default function useEnsureSignedIn(options?: { force?: boolean }): void {
	const force = options?.force ?? false;
	const storeApiRef = useRef<StoreApi<AppSlice> | undefined>(undefined);

	useEffect(() => {
		if (!storeApiRef.current) {
			storeApiRef.current = getStoreApi();
		}
		console.debug("[useEnsureSignedIn] effect mounted, force=", force);
		void ensureSignedIn({ force });
	}, [force]);
}
