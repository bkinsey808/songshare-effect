// Prefer localized console exceptions instead of module-level disables
import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";

import useAppForm from "@/react/lib/form/useAppForm";
import useLocale from "@/react/lib/language/locale/useLocale";
import { clientDebug, clientError, clientLog } from "@/react/lib/utils/clientLogger";
import { JUST_REGISTERED_SIGNAL } from "@/shared/constants/http";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { apiAccountRegisterPath, dashboardPath } from "@/shared/paths";
import { justSignedInQueryParam } from "@/shared/queryParams";
import { type RegisterForm, RegisterFormSchema } from "@/shared/register/register";
import { justRegisteredKey } from "@/shared/sessionStorageKeys";
import { safeSet } from "@/shared/utils/safe";

/**
 * Renders the user registration form and handles submission, validation,
 * and successful registration redirect behavior.
 *
 * @returns - A React element containing the registration UI and form logic.
 */
export default function RegisterPage(): ReactElement {
	const { lang, t } = useLocale();
	const usernameRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [submitError, setSubmitError] = useState<string | undefined>(undefined);

	const {
		handleFieldBlur,
		getFieldError,
		handleSubmit,
		isSubmitting,
		handleApiResponseEffect: handleApiResponse,
		reset,
		validationErrors,
		setValidationErrors,
	} = useAppForm<RegisterForm>({
		schema: RegisterFormSchema,
		formRef,
	});

	// Debug validation errors changes
	useEffect(() => {
		// Localized debug-only log
		clientDebug("🔄 validationErrors changed:", validationErrors);
	}, [validationErrors]);

	function handleUsernameBlur(): void {
		handleFieldBlur("username", usernameRef);
	}

	function handleUsernameChange(): void {
		// Clear validation errors for this field when user starts typing
		setValidationErrors((currentErrors) =>
			currentErrors.filter((error) => error.field !== "username"),
		);
	}

	function onSubmitSuccess(): void {
		// Redirect to dashboard on success. Add `justSignedIn=1` so the
		// RequireAuthBoundary knows to force-refresh `/api/me` and pick up the
		// HttpOnly session cookie that was set by the server during
		// registration. Without this param, a persisted signed-out state can
		// cause the client to skip the `/api/me` check and immediately
		// redirect back to the localized home page.
		try {
			// Set a one-time registration signal so the dashboard can show a
			// different success message when the user has just created an
			// account (instead of a generic "signed in" message).
			if (typeof globalThis !== "undefined") {
				sessionStorage.setItem(justRegisteredKey, JUST_REGISTERED_SIGNAL);
			}
		} catch {
			// ignore storage errors
		}

		globalThis.location.href = `${buildPathWithLang(`/${dashboardPath}`, lang)}?${justSignedInQueryParam}=${JUST_REGISTERED_SIGNAL}`;
	}

	async function onSubmit(data: RegisterForm): Promise<void> {
		// Localized debug-only log
		clientDebug("🔥 onSubmit called with data:", data);
		setSubmitError(undefined);

		try {
			// Localized debug-only log
			clientDebug("🌐 Making API request to:", apiAccountRegisterPath);
			const response = await fetch(apiAccountRegisterPath, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
				credentials: "include",
			});

			// Localized debug-only log
			clientDebug("📡 API response received:", {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
			});

			const isSuccess = await Effect.runPromise(handleApiResponse(response, setSubmitError));
			// Localized debug-only log
			clientDebug("✅ API response handled, success:", isSuccess);

			if (isSuccess) {
				// Localized debug-only log
				clientLog("🎉 Registration successful, redirecting to dashboard");
				onSubmitSuccess();
			} else {
				// Localized debug-only log
				clientLog("❌ Registration failed");
			}
		} catch (error) {
			// Localized: report network error
			clientError("💥 Network error:", error);
			setSubmitError(t("register.errors.networkError"));
		}
	}

	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	async function handleFormSubmit(event: React.FormEvent): Promise<void> {
		// Localized debug-only log
		clientDebug("📝 Form submit triggered", event);
		event.preventDefault();
		// Localized debug-only log
		clientDebug("🔄 Calling handleSubmit with onSubmit");

		// Read form data
		// Use nullish coalescing for clearer typing
		const formDataObj = new FormData(formRef.current ?? undefined);
		const currentFormData: Record<string, unknown> = {};
		for (const [key, value] of formDataObj.entries()) {
			if (typeof value === "string") {
				safeSet(currentFormData, key, value);
			} else if (value instanceof File) {
				safeSet(currentFormData, key, value.name);
			} else {
				safeSet(currentFormData, key, String(value));
			}
		}

		await Effect.runPromise(handleSubmit(currentFormData, onSubmit));
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="mb-8 text-2xl font-bold text-white">
				{t("register.title", "Complete Registration")}
			</h1>

			<form
				ref={formRef}
				onSubmit={(event) => {
					void handleFormSubmit(event);
				}}
				className="space-y-6"
			>
				<div>
					<label htmlFor="username" className="block text-sm font-medium text-gray-300">
						{t("register.username", "Username")}
					</label>
					<input
						ref={usernameRef}
						type="text"
						id="username"
						name="username"
						className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						placeholder={t("register.usernamePlaceholder", "Enter your username")}
						onBlur={handleUsernameBlur}
						onChange={handleUsernameChange}
					/>
					{(() => {
						const usernameError = getFieldError("username");
						// Localized debug-only logs
						clientDebug("🔍 Username error from getFieldError:", usernameError);
						clientDebug("🔍 All validation errors:", validationErrors);
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

				{typeof submitError === "string" && submitError !== "" && (
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
						onClick={() => {
							// Localized debug-only log
							clientDebug("🖱️ Create Account button clicked");
						}}
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
