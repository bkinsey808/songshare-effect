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

export default function useImageLibraryPage(): UseImageLibraryPageReturn {
	const { entries, error, isLoading } = useImageLibrary();
	const currentUserId = useCurrentUserId();
	const { lang } = useLocale();
	const navigate = useNavigate();

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
