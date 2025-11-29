---
description: Start the development servers (frontend + API)
---

# Run Development Servers

This workflow starts both the frontend and API development servers concurrently.

## Steps

// turbo

1. Start both development servers (automatically kills ports 8787 and 5173 first):

```bash
npm run dev
```

This will start:

- **Frontend** at http://localhost:5173/
- **API** at http://localhost:8787/

## Alternative Commands

For debugging with Chrome:

```bash
npm run dev:debug
```

To run only the frontend:

```bash
npm run dev:client
```

To run only the API:

```bash
npm run dev:api
```
