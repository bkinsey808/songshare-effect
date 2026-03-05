-- Ensure at most one share per (sender, recipient, item_type, item_id)
-- 1. Remove duplicate rows, keeping the oldest share per combination
-- 2. Add unique constraint to prevent future duplicates

-- Step 1: Capture duplicate share_ids before any deletes (share_public is source of truth)
CREATE TEMP TABLE share_ids_to_delete AS
SELECT share_id
FROM (
  SELECT share_id,
         ROW_NUMBER() OVER (
           PARTITION BY sender_user_id, recipient_user_id, shared_item_type, shared_item_id
           ORDER BY created_at ASC
         ) AS rn
  FROM public.share_public
) sub
WHERE rn > 1;

-- Delete in FK order: share_library -> share_public -> share
DELETE FROM public.share_library
WHERE share_id IN (SELECT share_id FROM share_ids_to_delete);

DELETE FROM public.share_public
WHERE share_id IN (SELECT share_id FROM share_ids_to_delete);

DELETE FROM public.share
WHERE share_id IN (SELECT share_id FROM share_ids_to_delete);

DROP TABLE share_ids_to_delete;

-- Step 2: Add unique constraint
CREATE UNIQUE INDEX share_public_one_per_user_per_item_idx
  ON public.share_public (sender_user_id, recipient_user_id, shared_item_type, shared_item_id);

COMMENT ON INDEX public.share_public_one_per_user_per_item_idx IS
  'Ensures at most one pending/accepted/rejected share per sender+recipient+item combination';
