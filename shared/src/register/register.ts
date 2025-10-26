import { Schema } from "effect";

// Define a unique symbol for custom error annotations
export const i18nMessageKey: unique symbol = Symbol.for("i18nMessage");

export type I18nMessage = {
	readonly key: string;
	readonly [param: string]: unknown;
};

export type RegisterForm = {
	readonly username: string;
};

export const RegisterFormSchema: Schema.Schema<
	RegisterForm,
	RegisterForm,
	never
> = Schema.Struct({
	username: Schema.String.pipe(
		Schema.minLength(1, { message: () => "field.required" }),
		Schema.annotations({
			[i18nMessageKey]: { key: "field.required", field: "username" },
		}),
		Schema.minLength(3, { message: () => "field.tooShort" }),
		Schema.annotations({
			[i18nMessageKey]: {
				key: "field.tooShort",
				field: "username",
				minLength: 3,
			},
		}),
		Schema.maxLength(30, { message: () => "field.tooLong" }),
		Schema.annotations({
			[i18nMessageKey]: {
				key: "field.tooLong",
				field: "username",
				maxLength: 30,
			},
		}),
		Schema.pattern(/^[a-zA-Z0-9_-]+$/, {
			message: () => "field.invalid",
		}),
		Schema.annotations({
			[i18nMessageKey]: { key: "field.invalid", field: "username" },
		}),
	),
});

export const RegisterFormFields = ["username"] as const;

export type RegisterFormField = (typeof RegisterFormFields)[number];

export const RegisterFormFieldSchema: Schema.Schema<
	RegisterFormField,
	RegisterFormField,
	never
> = Schema.Literal(...RegisterFormFields);
