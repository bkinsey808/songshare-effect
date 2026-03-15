import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import useLocale from "@/react/lib/language/locale/useLocale";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import buildPublicWebUrl from "@/react/lib/qr-code/buildPublicWebUrl";
import { userViewPath } from "@/shared/paths";

import useUserView from "./useUserView";

/**
 * Public user profile view resolved by username.
 *
 * @returns A user view page or a not-found/error state
 */
export default function UserView(): ReactElement {
	const { lang, t } = useLocale();
	const { username, userPublic, isLoading, error } = useUserView();

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl px-6 py-8 text-gray-300">
				{t("userView.loading", "Loading user...")}
			</div>
		);
	}

	if (error !== undefined && error !== "") {
		return (
			<div className="mx-auto max-w-3xl px-6 py-8 text-red-400">
				{t("userView.error", error)}
			</div>
		);
	}

	if (username === undefined || username === "" || userPublic === undefined) {
		return (
			<div className="mx-auto max-w-3xl px-6 py-8 text-gray-300">
				{t("userView.notFound", "User not found")}
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-3xl font-bold text-white">{userPublic.username}</h1>
				<ShareButton
					itemType="user"
					itemId={userPublic.user_id}
					itemName={userPublic.username}
				/>
			</div>

			<CollapsibleQrCode
				url={buildPublicWebUrl(`/${userViewPath}/${userPublic.username}`, lang)}
				label={userPublic.username}
			/>
		</div>
	);
}
