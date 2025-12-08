# API Reference

Complete reference for all API endpoints in the SongShare Effect API.

## Base URL

- **Development**: `http://localhost:8787`
- **Production**: `https://api.effect.bardoshare.com` (or your configured domain)

## Authentication

The API uses JWT-based authentication with two token types:

### Visitor Token (Anonymous Access)

For unauthenticated users with read-only access.

**Endpoint**: `GET /api/auth/visitor`

**Response**:

```json
{
	"access_token": "eyJhbGc...",
	"token_type": "bearer",
	"expires_in": 3600
}
```

**Usage**:

```bash
curl http://localhost:8787/api/auth/visitor
```

### Using Tokens

Include the token in the `Authorization` header:

```bash
curl http://localhost:8787/api/songs \
  -H "Authorization: Bearer eyJhbGc..."
```

## Health Check

### GET /health

Check API health and status.

**Authentication**: None

**Response**:

```json
{
	"status": "ok",
	"environment": "development",
	"timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Example**:

```bash
curl http://localhost:8787/health
```

## Test Endpoints

### GET /api/hello

Simple test endpoint for E2E tests.

**Authentication**: None

**Response**:

```json
{
	"message": "Hello from custom API endpoint!"
}
```

## Authentication Endpoints

### POST /api/auth/signout

Sign out current user by clearing session cookie.

**Authentication**: Required (User token)

**CSRF Protection**: Yes (same-origin check)

**Response**:

```json
{
	"success": true
}
```

**Example**:

```bash
curl -X POST http://localhost:8787/api/auth/signout \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Origin: http://localhost:5173"
```

## OAuth Endpoints

### GET /api/oauth/signin/:provider

Initiate OAuth sign-in flow for the specified provider.

**Authentication**: None

**Parameters**:

- `provider` (path): OAuth provider name (e.g., `google`, `github`)

**Response**: Redirects to OAuth provider

**Example**:

```bash
# Redirect user to this URL in browser
http://localhost:8787/api/oauth/signin/google
```

### GET /api/oauth/callback

OAuth callback endpoint. Called by OAuth provider after authentication.

**Authentication**: None

**Query Parameters**:

- `code`: Authorization code from provider
- `state`: Anti-CSRF state token

**Response**: Sets session cookie and redirects to app

## User Endpoints

### GET /api/me

Get current user/session information.

**Authentication**: Required (Visitor or User token)

**Response**:

```json
{
	"success": true,
	"data": {
		"id": "user-id",
		"email": "user@example.com",
		"role": "authenticated"
	}
}
```

**Example**:

```bash
curl http://localhost:8787/api/me \
  -H "Authorization: Bearer eyJhbGc..."
```

## Account Endpoints

### POST /api/account/register

Register a new user account.

**Authentication**: None

**Request**:

```json
{
	"email": "newuser@example.com",
	"password": "securepassword",
	"displayName": "New User"
}
```

**Response**:

```json
{
	"success": true,
	"data": {
		"id": "user-id",
		"email": "newuser@example.com"
	}
}
```

**Errors**:

- `400`: Validation error (missing/invalid fields)
- `409`: Email already exists
- `500`: Registration failed

**Example**:

```bash
curl -X POST http://localhost:8787/api/account/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword",
    "displayName": "New User"
  }'
```

### POST /api/account/delete

Delete current user account.

**Authentication**: Required (User token)

**CSRF Protection**: Yes

**Response**:

```json
{
	"success": true,
	"message": "Account deleted"
}
```

**Errors**:

- `401`: Unauthorized (no token or invalid token)
- `500`: Deletion failed

**Example**:

```bash
curl -X POST http://localhost:8787/api/account/delete \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Origin: http://localhost:5173"
```

## Song Endpoints

### POST /api/songs/save

Save a song (create or update).

**Authentication**: Required (User token for create/update)

**CSRF Protection**: Yes

**Request**:

```json
{
	"id": "song-id-for-update",
	"title": "Song Title",
	"artist": "Artist Name",
	"lyrics": "Song lyrics...",
	"chords": "Chord progression..."
}
```

**Response**:

```json
{
	"success": true,
	"data": {
		"id": "song-id",
		"title": "Song Title",
		"artist": "Artist Name",
		"created_at": "2024-01-15T12:00:00.000Z",
		"updated_at": "2024-01-15T12:00:00.000Z"
	}
}
```

**Errors**:

- `400`: Validation error (missing title, etc.)
- `401`: Unauthorized
- `403`: Forbidden (can't edit others' songs)
- `500`: Database error

**Example**:

```bash
curl -X POST http://localhost:8787/api/songs/save \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "title": "Test Song",
    "artist": "Test Artist"
  }'
```

### POST /api/upload

Upload a song file (to be implemented).

**Authentication**: Required (User token)

**Status**: 🚧 Not yet implemented

**Request**: `multipart/form-data` with file

**Response**:

```json
{
	"message": "Upload endpoint - to be implemented"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
	"success": false,
	"error": "Error message describing what went wrong"
}
```

### Error Status Codes

- `400` - Bad Request: Invalid input or missing required fields
- `401` - Unauthorized: Missing or invalid authentication token
- `403` - Forbidden: Valid token but insufficient permissions
- `404` - Not Found: Resource doesn't exist
- `409` - Conflict: Resource already exists (e.g., duplicate email)
- `500` - Internal Server Error: Server-side error

### Example Error Response

```json
{
	"success": false,
	"error": "Email and password are required"
}
```

## CORS Configuration

The API supports CORS for allowed origins.

**Development**: All origins allowed with `Origin` header
**Production**: Only configured origins in `ALLOWED_ORIGINS` environment variable

**Preflight Requests**: Supported (OPTIONS method)

**Headers**:

- `Access-Control-Allow-Origin`: Specific origin (not `*`)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization, X-CSRF-Token`
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `86400` (24 hours)

## Rate Limiting

**Status**: 🚧 Not yet implemented

Future implementation will include:

- Per-IP rate limiting
- Per-user rate limiting
- Different limits for authenticated vs. anonymous users

## Webhooks

**Status**: 🚧 Not yet implemented

Future webhook support for:

- Song creation/updates
- User registration
- Authentication events

## SDK / Client Libraries

### JavaScript/TypeScript

Use the Supabase client or fetch API:

```typescript
// Using fetch
const response = await fetch("http://localhost:8787/api/songs/save", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	},
	body: JSON.stringify({ title: "New Song" }),
});

const data = await response.json();
```

### Example React Hook

```typescript
import { useState } from "react";

export function useApi() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const callApi = async (endpoint: string, options?: RequestInit) => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
				{
					...options,
					headers: {
						"Content-Type": "application/json",
						...options?.headers,
					},
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Request failed");
			}

			return data;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { callApi, loading, error };
}
```

## Version History

- **v1** (Current): Initial API implementation
  - Basic authentication (visitor + user tokens)
  - OAuth support (Google, GitHub, etc.)
  - Song management
  - Account management

## Future Endpoints

Planned additions:

- `GET /api/songs` - List songs with pagination/filtering
- `GET /api/songs/:id` - Get single song by ID
- `PUT /api/songs/:id` - Update specific song
- `DELETE /api/songs/:id` - Delete song
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist

## Support

For API issues:

1. Check [Troubleshooting Guide](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/troubleshooting.md)
2. Review [Authentication System Docs](file:///home/bkinsey/bkinsey808/songshare-effect/docs/authentication-system.md)
3. Check server logs
4. File an issue on GitHub

## References

- [Effect-TS Implementation](file:///home/bkinsey/bkinsey808/songshare-effect/docs/effect-implementation.md)
- [Authentication System](file:///home/bkinsey/bkinsey808/songshare-effect/docs/authentication-system.md)
- [Add API Endpoint Workflow](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/workflows/add-api-endpoint.md)
