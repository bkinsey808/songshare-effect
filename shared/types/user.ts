export type User = {
	id: string;
	email: string;
	username: string;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateUserRequest = {
	email: string;
	username: string;
	password: string;
};

export type LoginRequest = {
	email: string;
	password: string;
};

export type AuthResponse = {
	user: Omit<User, "password">;
	token: string;
};
