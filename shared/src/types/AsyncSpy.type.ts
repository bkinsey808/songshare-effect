export type AsyncSpy = {
	mockReturnValue: (value: unknown) => void;
	mockReturnValueOnce: (value: unknown) => void;
	mockResolvedValue: (value: unknown) => void;
	mockResolvedValueOnce?: (value: unknown) => void;
	mockImplementation?: (...args: readonly unknown[]) => unknown;
	mockReset?: () => void;
};
