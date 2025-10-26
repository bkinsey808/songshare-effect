import { Effect } from "effect";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppForm } from "@/react/form/useAppForm";
import type { SupportedLanguageType } from "@/shared/language/supportedLanguages";
import { apiAccountRegisterPath, dashboardPath } from "@/shared/paths";
import {
	type RegisterForm,
	RegisterFormSchema,
} from "@/shared/register/register";

export default function RegisterPage(): ReactElement {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguageType;
	const usernameRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [submitError, setSubmitError] = useState<string | undefined>(undefined);

	const {
		handleFieldBlur,
		getFieldError,
		handleSubmit,
		isSubmitting,
		handleApiResponse,
		reset,
		validationErrors,
		setValidationErrors,
	} = useAppForm({
		schema: RegisterFormSchema,
		formRef,
	});

	// Debug validation errors changes
	useEffect(() => {
		console.log("🔄 validationErrors changed:", validationErrors);
	}, [validationErrors]);

	const handleUsernameBlur = (): void => {
		handleFieldBlur("username", usernameRef);
	};

	const handleUsernameChange = (): void => {
		// Clear validation errors for this field when user starts typing
		setValidationErrors((currentErrors) =>
			currentErrors.filter((error) => error.field !== "username"),
		);
	};

	const onSubmitSuccess = (): void => {
		// Redirect to dashboard on success
		window.location.href = `/${currentLang}/${dashboardPath}`;
	};

	const onSubmit = async (data: RegisterForm): Promise<void> => {
		console.log("🔥 onSubmit called with data:", data);
		setSubmitError(undefined);

		try {
			console.log("🌐 Making API request to:", apiAccountRegisterPath);
			const response = await fetch(apiAccountRegisterPath, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
				credentials: "include",
			});

			console.log("📡 API response received:", {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
			});

			const isSuccess = await Effect.runPromise(
				handleApiResponse(response, setSubmitError),
			);
			console.log("✅ API response handled, success:", isSuccess);
			if (isSuccess) {
				console.log("🎉 Registration successful, redirecting to dashboard");
				onSubmitSuccess();
			} else {
				console.log("❌ Registration failed");
			}
		} catch (error) {
			console.error("💥 Network error:", error);
			setSubmitError(t("register.errors.networkError"));
		}
	};

	const handleFormSubmit = async (event: React.FormEvent): Promise<void> => {
		console.log("📝 Form submit triggered", event);
		event.preventDefault();
		console.log("🔄 Calling handleSubmit with onSubmit");
		await Effect.runPromise(handleSubmit(onSubmit));
	};

	return (
		<div className="mx-auto max-w-md">
			<h1 className="mb-8 text-2xl font-bold text-white">
				{t("register.title", "Complete Registration")}
			</h1>

			<form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6">
				<div>
					<label
						htmlFor="username"
						className="block text-sm font-medium text-gray-300"
					>
						{t("register.username", "Username")}
					</label>
					<input
						ref={usernameRef}
						type="text"
						id="username"
						name="username"
						className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						placeholder={t(
							"register.usernamePlaceholder",
							"Enter your username",
						)}
						onBlur={handleUsernameBlur}
						onChange={handleUsernameChange}
					/>
					{(() => {
						const usernameError = getFieldError("username");
						console.log("🔍 Username error from getFieldError:", usernameError);
						console.log("🔍 All validation errors:", validationErrors);
						return (
							usernameError && (
								<p className="mt-1 text-sm text-red-400">
									{t(usernameError.message, {
										...usernameError.params,
										defaultValue: usernameError.message,
									})}
								</p>
							)
						);
					})()}
				</div>

				{typeof submitError === "string" && submitError.length > 0 && (
					<div className="rounded-md bg-red-900/50 p-4">
						<p className="text-sm text-red-400">{submitError}</p>
					</div>
				)}

				<div className="flex gap-4">
					<button
						type="button"
						onClick={reset}
						className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
					>
						{t("register.reset", "Reset Form")}
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						onClick={() => console.log("🖱️ Create Account button clicked")}
					>
						{isSubmitting
							? t("register.submitting", "Creating account...")
							: t("register.submit", "Create Account")}
					</button>
				</div>
			</form>
		</div>
	);
}
