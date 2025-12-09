import { SongFormSchema } from "@/shared/song/songFormSchema";
import { SongPublicSchema } from "@/shared/generated/supabaseSchemas";
import { RegisterDataSchema } from "@/shared/register/registerData";

export type ApiEndpoint = {
  path: string;
  method: "get" | "post" | "put" | "delete";
  requestSchema?: unknown;
  responseSchema?: unknown;
  summary?: string;
};

export const ApiSchemaRegistry: ApiEndpoint[] = [
  {
    path: "/api/songs/save",
    method: "post",
    requestSchema: SongFormSchema,
    responseSchema: SongPublicSchema,
    summary: "Create or update a public song record (server validates via Effect schemas)",
  },
  {
    path: "/api/account/register",
    method: "post",
    requestSchema: RegisterDataSchema,
    // registration handler returns a short form success object; keep response undefined
    responseSchema: undefined,
    summary: "Register a new account after OAuth flow",
  },
  {
    path: "/api/auth/visitor",
    method: "get",
    summary: "Return a visitor token for client-side Supabase access",
  },
  {
    path: "/api/me",
    method: "get",
    // me() endpoint uses shared generated supabase types for user; leave undefined here
    responseSchema: undefined,
    summary: "Return current user (if signed in)",
  },
];

export default ApiSchemaRegistry;
