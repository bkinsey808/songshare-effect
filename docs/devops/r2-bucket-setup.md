# Cloudflare R2 Bucket Setup

This guide walks through creating a Cloudflare R2 bucket and wiring it into the project for local development, staging, and production.

The API uses the `BUCKET` binding (an `R2Bucket`) to store uploaded images. Without it, any call to `/api/images/upload`, `/api/images/delete`, or `/api/images/serve/:image_key` will fail with a 500 error.

---

## Prerequisites

- Cloudflare account with R2 enabled (free tier includes 10 GB/month)
- `wrangler` CLI authenticated: `npx wrangler login`

---

## Step 1 — Enable R2 on your Cloudflare account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. If prompted, click **Purchase R2** (it is free up to the free-tier limits — no charge required to enable it, but a payment method must be on file)

---

## Step 2 — Create your buckets

You need two buckets: one for production/local dev and one for preview/staging deploys.

```bash
# Production bucket (also used for local dev)
npx wrangler r2 bucket create songshare-images

# Preview/staging bucket
npx wrangler r2 bucket create songshare-images-preview
```

Verify they were created:

```bash
npx wrangler r2 bucket list
```

You should see both `songshare-images` and `songshare-images-preview` in the output.

> **Naming note:** Bucket names must be globally unique within your Cloudflare account. If `songshare-images` is taken, try `<your-project>-images` or any name you prefer — just use the same name in wrangler.toml below.

---

## Step 3 — Add the R2 binding to `api/wrangler.toml`

Open `api/wrangler.toml` and add the `[[r2_buckets]]` block **before** the `[env.dev]` section:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "songshare-images"
preview_bucket_name = "songshare-images-preview"
```

The file should look like this after the edit:

```toml
name = "songshare-effect-api"
main = "src/server.ts"

compatibility_date = "2024-09-23"

[dev]
port = 8787

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "songshare-images"
preview_bucket_name = "songshare-images-preview"

[env.staging]

[env.production]
```

> The `preview_bucket_name` is used by `wrangler dev` and Pages preview deployments. Using a separate bucket keeps dev uploads isolated from production data.

---

## Step 4 — Enable R2 mode via environment variable

The Worker and frontend both check `STORAGE_BACKEND` / `VITE_STORAGE_BACKEND` to decide whether to use R2 or Supabase storage. Set these in the keyring for each environment:

```bash
# Enable R2 for local dev:
echo -n "r2" | keyring set songshare-dev STORAGE_BACKEND
echo -n "r2" | keyring set songshare-dev VITE_STORAGE_BACKEND

# Enable R2 for production:
echo -n "r2" | keyring set songshare-production STORAGE_BACKEND
echo -n "r2" | keyring set songshare-production VITE_STORAGE_BACKEND
```

Then regenerate `.dev.vars`: `npm run generate:dev-vars`

---

## Step 5 — Restart the local API server

The wrangler dev process must be restarted to pick up the new binding:

```bash
# Stop the running dev server (Ctrl+C in the dev terminal), then:
npm run dev:api
# or if running both:
npm run dev:all
```

After restart, wrangler will automatically connect to the local R2 simulator backed by the real `songshare-images-preview` bucket.

---

## Step 6 — Verify the binding works

Test a quick upload via curl (while dev servers are running):

```bash
curl -k -X POST https://localhost:8787/api/images/upload \
  -H "Authorization: Bearer <your-user-token>" \
  -F "file=@/path/to/test-image.jpg" \
  -F "image_name=Test Image" \
  -F "alt_text=A test image"
```

A successful response returns a JSON object with `image_slug` and other fields. A 500 with `BUCKET` undefined means the binding wasn't picked up — double-check the `wrangler.toml` edit and restart.

---

## Step 7 — Add the binding for the production Worker

The production Worker also needs the binding. Add `[[r2_buckets]]` to the root of `api/wrangler.toml` (as done in Step 3) — Wrangler inherits the top-level binding for all environments including `[env.production]`.

No additional change is needed; the single `[[r2_buckets]]` block at the top level covers dev, staging, and production.

---

## Step 8 — (Optional) Configure CORS on the bucket

If you ever serve images directly from the R2 public URL (rather than through the `/api/images/serve/:image_key` proxy), you may need a CORS policy. Currently the app proxies all image reads through the API, so this is not required.

---

## Step 9 — Add the binding to the staging Worker config

Open `api/wrangler.staging.toml` and add the same `[[r2_buckets]]` block:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "songshare-images"
preview_bucket_name = "songshare-images-preview"
```

---

## Summary of changes

| File / Location                | Change                                               |
| ------------------------------ | ---------------------------------------------------- |
| `api/wrangler.toml`            | Add `[[r2_buckets]]` block with `binding = "BUCKET"` |
| `api/wrangler.staging.toml`    | Add the same `[[r2_buckets]]` block                  |
| `songshare-dev` keyring        | `STORAGE_BACKEND=r2`, `VITE_STORAGE_BACKEND=r2`      |
| `songshare-staging` keyring    | `STORAGE_BACKEND=r2`, `VITE_STORAGE_BACKEND=r2`      |
| `songshare-production` keyring | `STORAGE_BACKEND=r2`, `VITE_STORAGE_BACKEND=r2`      |

---

## Troubleshooting

| Symptom                                                          | Cause                                              | Fix                                                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `500` on `/api/images/upload`                                    | `BUCKET` binding missing or wrangler not restarted | Check `wrangler.toml`, restart dev server                                                                          |
| `TypeError: Cannot read properties of undefined (reading 'put')` | Same as above                                      | Same fix                                                                                                           |
| `wrangler r2 bucket create` fails with "already exists"          | Name taken                                         | Choose a different name and update `wrangler.toml`                                                                 |
| Upload succeeds but image doesn't display                        | R2 key stored in DB but `imageServe` can't find it | Verify `r2_key` in `image_public` table matches actual key in bucket (`npx wrangler r2 object get <bucket> <key>`) |
