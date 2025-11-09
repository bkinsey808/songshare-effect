export type ValidationError = {
	readonly field: string;
	readonly message: string;
	readonly params?: Record<string, unknown>;
};

export type ValidationResult<T> =
	| {
			readonly success: true;
			readonly data: T;
	  }
	| {
			readonly success: false;
			readonly errors: ReadonlyArray<ValidationError>;
	  };
