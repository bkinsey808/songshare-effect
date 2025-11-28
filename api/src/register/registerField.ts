import { Schema } from "effect";

export type RegisterForm = {
	readonly username: string;
};

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

export const RegisterFormSchema: Schema.Schema<RegisterForm> = Schema.Struct({
	username: Schema.NonEmptyString.pipe(
		Schema.minLength(USERNAME_MIN_LENGTH, {
			message: () => "register.usernameTooShort",
		}),
		Schema.maxLength(USERNAME_MAX_LENGTH, {
			message: () => "register.usernameTooLong",
		}),
		Schema.pattern(/^[a-zA-Z0-9_-]+$/, {
			message: () => "register.usernameInvalid",
		}),
	),
});

export const RegisterFormFields = ["username"] as const;

export type RegisterFormField = (typeof RegisterFormFields)[number];

export const RegisterFormFieldSchema: Schema.Schema<RegisterFormField> =
	Schema.Literal(...RegisterFormFields);
