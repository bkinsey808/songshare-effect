import { useNavigate } from "react-router-dom";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import useLocale from "@/react/lib/language/locale/useLocale";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { dashboardPath, imageUploadPath } from "@/shared/paths";

import useImageLibrary from "./useImageLibrary";

export type UseImageLibraryPageReturn = {
	currentUserId: string | undefined;
	entries: ReturnType<typeof useImageLibrary>["entries"];
	error: string | undefined;
	handleUploadClick: () => void;
	isLoading: boolean;
};

/**
 * Hook used by the image library page to expose entries and upload navigation.
 *
 * @returns A small interface containing entries, loading state and upload handler.
 */
export default function useImageLibraryPage(): UseImageLibraryPageReturn {
	const { entries, error, isLoading } = useImageLibrary();
	const currentUserId = useCurrentUserId();
	const { lang } = useLocale();
	const navigate = useNavigate();

	/**
	 * Navigate to the image upload page for the current language.
	 *
	 * @returns void
	 */
	function handleUploadClick(): void {
		void navigate(buildPathWithLang(`/${dashboardPath}/${imageUploadPath}`, lang));
	}

	return {
		currentUserId,
		entries,
		error,
		handleUploadClick,
		isLoading,
	};
}
