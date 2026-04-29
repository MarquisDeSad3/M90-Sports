-- Crea la categoría top-level "Accesorios" para productos en stock
-- (llaveros, parches y cositas pequeñas). NO confundir con
-- "encargo-accesorios" (slug distinto), que vive bajo "Por encargo"
-- y se usa para polos/sudaderas por pedido.
--
-- Idempotente: re-ejecutarla no duplica nada ni pisa la posición si
-- ya la moviste desde /admin/categories.

INSERT INTO categories (
  id, parent_id, slug, name, description,
  position, visible, created_at, updated_at
)
SELECT
  'cat_accesorios',
  NULL,
  'accesorios',
  'Accesorios',
  'Llaveros, parches y cositas para coleccionistas.',
  -- Se coloca al final de las top-level. Reordena con drag-drop en
  -- /admin/categories cuando quieras moverla (por ejemplo, justo
  -- después de Retro).
  (SELECT COALESCE(MAX(position), 0) + 10
   FROM categories
   WHERE parent_id IS NULL),
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'accesorios'
);

-- Verificación rápida.
SELECT id, slug, name, parent_id, position, visible
FROM categories
WHERE slug = 'accesorios';
