import { Schema } from "effect";

// Define a unique symbol for custom error annotations
export const i18nMessageKey: unique symbol = Symbol.for("i18nMessage");

export interface I18nMessage {
	readonly key: string;
	readonly [param: string]: any;
}

export type RegisterForm = {
	readonly username: string;
};

export const RegisterFormSchema: Schema.Schema<
	RegisterForm,
	RegisterForm,
	never
> = Schema.Struct({
	username: Schema.String.pipe(
		Schema.minLength(1, { message: () => "register.usernameRequired" }),
		Schema.annotations({
			[i18nMessageKey]: { key: "register.usernameRequired" },
		}),
		Schema.minLength(3, { message: () => "register.usernameTooShort" }),
		Schema.annotations({
			[i18nMessageKey]: { key: "register.usernameTooShort" },
		}),
		Schema.maxLength(30, { message: () => "register.usernameTooLong" }),
		Schema.annotations({
			[i18nMessageKey]: { key: "register.usernameTooLong", maxLength: 30 },
		}),
		Schema.pattern(/^[a-zA-Z0-9_-]+$/, {
			message: () => "register.usernameInvalid",
		}),
		Schema.annotations({
			[i18nMessageKey]: { key: "register.usernameInvalid" },
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
