-- Restructure preorder ("encargo-*") categories under a single
-- "Por encargo" parent. Idempotent — safe to run multiple times.

-- 1. Make sure the parent exists.
INSERT INTO categories (id, slug, name, position, visible, created_at, updated_at)
SELECT 'cat_por_encargo_001', 'por-encargo', 'Por encargo', 99, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'por-encargo');

-- 2. Reparent every encargo-* category and strip the " (por encargo)"
--    suffix from its display name. The suffix is now redundant — the
--    parent already says "Por encargo".
UPDATE categories
SET
  parent_id = (SELECT id FROM categories WHERE slug = 'por-encargo'),
  name = TRIM(REPLACE(name, ' (por encargo)', '')),
  updated_at = NOW()
WHERE slug LIKE 'encargo-%';

-- 3. Verify
SELECT
  CASE WHEN parent_id IS NULL THEN '— ROOT' ELSE '   └─' END AS level,
  slug, name, position, visible
FROM categories
WHERE slug = 'por-encargo' OR slug LIKE 'encargo-%'
ORDER BY parent_id NULLS FIRST, position, name;
