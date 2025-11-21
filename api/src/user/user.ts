import { type User } from "shared/dist/src/generated/supabaseSchemas";

import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

export type ReadonlyUser = ReadonlyDeep<User>;
