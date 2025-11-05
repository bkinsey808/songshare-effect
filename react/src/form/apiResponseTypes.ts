/**
 * Actions that can result from API response processing
 */
export type ApiResponseAction =
	| { type: "setFieldError"; field: string; message: string }
	| { type: "setGeneralError"; message: string };
