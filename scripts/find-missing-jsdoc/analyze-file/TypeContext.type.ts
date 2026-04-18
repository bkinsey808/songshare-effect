import type { Program, TypeChecker } from "typescript";

export type TypeContext = {
	checker: TypeChecker;
	program: Program;
};
