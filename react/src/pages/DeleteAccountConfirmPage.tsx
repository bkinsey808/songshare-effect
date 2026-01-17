import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import getCookie from "@/react/utils/getCookie";
import { getStoreApi } from "@/react/zustand/useAppStore";
import {
	EMPTY_STRING,
	JUST_DELETED_ACCOUNT_SIGNAL,
	LANG_PATH_SEGMENT_INDEX,
} from "@/shared/constants/http";
import { SupportedLanguage } from "@/shared/language/supported-languages";
import { apiAccountDeletePath, dashboardPath } from "@/shared/paths";
import { justDeletedAccountKey } from "@/shared/sessionStorageKeys";

export default function DeleteAccountConfirmPage(): ReactElement {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	const pathname = typeof globalThis === "undefined" ? "/" : globalThis.location.pathname;
	const maybeLang = pathname.split("/")[LANG_PATH_SEGMENT_INDEX] ?? EMPTY_STRING;
	const currentLang = maybeLang || SupportedLanguage.en;

	function onCancel(): void {
		void navigate(`/${currentLang}/${dashboardPath}`, { replace: true });
	}

	const ZERO = 0;

	async function onConfirm(): Promise<void> {
		setError(undefined);
		setLoading(true);

		// Perform network fetch and handle network errors separately so the
		// compiler plugin doesn't need to reason about complex control flow
		// inside try/catch blocks.
		const csrf = getCookie("csrf-token");
		let headers: HeadersInit | undefined = undefined;
		if (typeof csrf === "string" && csrf.length > ZERO) {
			headers = { "X-CSRF-Token": csrf };
		}

		let res: Response | undefined = undefined;
		try {
			const init: RequestInit = {
				method: "POST",
				credentials: "include",
			};
			if (headers) {
				init.headers = headers;
			}

			res = await fetch(apiAccountDeletePath, init);
		} catch (error) {
			setError(String(error));
			setLoading(false);
			return;
		}

		if (!res?.ok) {
			const text = await (res?.text() ?? "");
			let errMsg = "";
			if (typeof text === "string" && text.length > ZERO) {
				errMsg = text;
			} else {
				errMsg = `Failed to delete account (status ${res?.status ?? "no-response"})`;
			}
			setError(errMsg);
			setLoading(false);
			return;
		}

		// Clear client side signed-in state (imperative; no try/catch needed)
		const api = getStoreApi();
		if (api) {
			try {
				api.getState().setIsSignedIn(false);
			} catch {
				// ignore any setter errors
			}
		}

		// Set a flag in sessionStorage to indicate account was just deleted.
		// Home will read this and display the one-time alert.
		try {
			sessionStorage.setItem(justDeletedAccountKey, JUST_DELETED_ACCOUNT_SIGNAL);
		} catch {
			// ignore sessionStorage errors
		}

		// Redirect to localized home (no query param)
		void navigate(`/${currentLang}`, {
			replace: true,
		});
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="mb-4 text-2xl font-bold text-white">
				{t("deleteAccount.title", "Confirm account deletion")}
			</h1>

			<p className="mb-6 text-gray-300">
				{t(
					"deleteAccount.body",
					"This will permanently delete your account and all associated data. This action cannot be undone.",
				)}
			</p>

			{typeof error === "string" && error.length > ZERO && (
				<div className="mb-4 rounded-md bg-red-900/50 p-4">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			<div className="flex gap-4">
				<button
					type="button"
					disabled={loading}
					onClick={onCancel}
					className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
				>
					{t("deleteAccount.cancel", "Cancel")}
				</button>

				<button
					type="button"
					disabled={loading}
					onClick={() => {
						void onConfirm();
					}}
					className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{loading
						? t("deleteAccount.deleting", "Deleting...")
						: t("deleteAccount.confirm", "Delete account")}
				</button>
			</div>
		</div>
	);
}
