import { Schema } from "effect";

export type RegisterForm = {
	readonly username: string;
};

export const RegisterFormSchema: Schema.Schema<RegisterForm> = Schema.Struct({
	username: Schema.NonEmptyString.pipe(
		Schema.minLength(3, { message: () => "register.usernameTooShort" }),
		Schema.maxLength(30, { message: () => "register.usernameTooLong" }),
		Schema.pattern(/^[a-zA-Z0-9_-]+$/, {
			message: () => "register.usernameInvalid",
		}),
	),
});

export const RegisterFormFields = ["username"] as const;

export type RegisterFormField = (typeof RegisterFormFields)[number];

export const RegisterFormFieldSchema: Schema.Schema<RegisterFormField> =
	Schema.Literal(...RegisterFormFields);
