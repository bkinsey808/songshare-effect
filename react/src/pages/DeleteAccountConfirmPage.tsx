import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import Button from "@/react/design-system/Button";
import DangerIcon from "@/react/design-system/icons/DangerIcon";
import TrashIcon from "@/react/design-system/icons/TrashIcon";
import XIcon from "@/react/design-system/icons/XIcon";
import getCookie from "@/react/utils/getCookie";
import {
	EMPTY_STRING,
	JUST_DELETED_ACCOUNT_SIGNAL,
	LANG_PATH_SEGMENT_INDEX,
} from "@/shared/constants/http";
import { ZERO } from "@/shared/constants/shared-constants";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage, SupportedLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { apiAccountDeletePath, dashboardPath } from "@/shared/paths";
import { justDeletedAccountKey } from "@/shared/sessionStorageKeys";

/**
 * DeleteAccountConfirmPage
 *
 * Confirmation UI that handles account deletion flow: shows warnings,
 * submits the deletion request, and redirects on success.
 *
 * @returns - A React element that renders the delete confirmation UI.
 */
export default function DeleteAccountConfirmPage(): ReactElement {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);

	const pathname = typeof globalThis === "undefined" ? "/" : globalThis.location.pathname;
	const maybeLang = pathname.split("/")[LANG_PATH_SEGMENT_INDEX] ?? EMPTY_STRING;
	const currentLang = maybeLang || SupportedLanguage.en;

	function onCancel(): void {
		const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
		void navigate(buildPathWithLang(`/${dashboardPath}`, langForNav), { replace: true });
	}

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
			setError(extractErrorMessage(error, String(error)));
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

		// Clear client side signed-in state
		useAppStore.getState().setIsSignedIn(false);

		// Set a flag in sessionStorage to indicate account was just deleted.
		// Home will read this and display the one-time alert.
		try {
			sessionStorage.setItem(justDeletedAccountKey, JUST_DELETED_ACCOUNT_SIGNAL);
		} catch {
			// ignore sessionStorage errors
		}

		// Redirect to localized home (no query param)
		const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
		void navigate(buildPathWithLang("/", langForNav), { replace: true });
	}

	return (
		<div className="mx-auto max-w-md rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-4">
			<div className="flex items-start gap-4">
				<DangerIcon className="mt-0.5 size-5 shrink-0 text-red-400" />
				<div className="min-w-0 flex-1">
					<h1 className="mb-2 text-xl font-bold text-red-200">
						{t("deleteAccount.title", "Confirm account deletion")}
					</h1>
					<p className="mb-4 text-red-200/90">
						{t(
							"deleteAccount.body",
							"This will permanently delete your account and all associated data. This action cannot be undone.",
						)}
					</p>
					{typeof error === "string" && error.length > ZERO && (
						<div className="mb-4 rounded-md bg-red-900/50 px-3 py-2">
							<p className="text-sm text-red-300">{error}</p>
						</div>
					)}
					<div className="flex flex-wrap items-center gap-3">
						<Button
							variant="outlineSecondary"
							icon={<XIcon className="size-4" />}
							onClick={onCancel}
							disabled={loading}
							data-testid="delete-account-cancel"
						>
							{t("deleteAccount.cancel", "Cancel")}
						</Button>
						<Button
							variant="danger"
							icon={<TrashIcon className="size-4" />}
							onClick={() => {
								void onConfirm();
							}}
							disabled={loading}
							data-testid="delete-account-confirm"
						>
							{loading
								? t("deleteAccount.deleting", "Deleting...")
								: t("deleteAccount.confirm", "Delete account")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
