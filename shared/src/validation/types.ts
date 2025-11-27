export type ValidationError = {
	readonly field: string;
	readonly message: string;
	readonly params?: Record<string, unknown>;
};

export type ValidationResult<TValue> =
	| {
			readonly success: true;
			readonly data: TValue;
	  }
	| {
			readonly success: false;
			readonly errors: ReadonlyArray<ValidationError>;
	  };
