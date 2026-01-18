import useLanguageDetector from "./useLanguageDetector";

export default function LanguageDetector(): ReactElement {
	useLanguageDetector();

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<div className="mb-2">Redirecting to your preferred language...</div>
				<div className="text-sm text-gray-400">Detecting language preferences</div>
			</div>
		</div>
	);
}
