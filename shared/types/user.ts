export interface User {
	id: string;
	email: string;
	username: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateUserRequest {
	email: string;
	username: string;
	password: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface AuthResponse {
	user: Omit<User, "password">;
	token: string;
}
