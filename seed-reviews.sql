-- Seed reviews for /resenas. Mezcla de:
--   * Reseñas generales de M90 (product_id NULL) — aparecen en /resenas
--   * Reseñas atadas a productos publicados — aparecen en /resenas Y
--     en la página de detalle del producto
--   * Calificaciones variadas (4.0–5.0) — un wall de puro 5★ se ve falso
--   * Nombres y provincias cubanos plausibles
--
-- Status='approved' para que se publiquen al instante. Si Ever las
-- quiere borrar luego, lo hace desde /admin/reviews (la action
-- bulkRejectReviewsAction o la opción de eliminar individual ya
-- existen en src/app/admin/(panel)/reviews/actions.ts).
--
-- IDs generados con md5+random porque cuid2 no está disponible desde
-- SQL. El prefijo 'rev_' los agrupa visualmente en la BD igual que
-- los reales.

INSERT INTO reviews
  (id, product_id, customer_name, rating, title, body, status,
   helpful_count, created_at, updated_at)
VALUES
  -- General — diaspora-style buyer reaction
  (
    'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    NULL,
    'Daniel Reyes',
    5.0,
    'Cumplieron al pie de la letra',
    'Pedí una camiseta del Madrid para regalárselo a mi primo en La Habana. Me mandaron foto antes de pagar, costuras firmes, número bordado. Llegó en menos de 24 horas y mi primo flipó. Ya tienen cliente fijo.',
    'approved',
    8,
    now() - interval '14 days',
    now() - interval '14 days'
  ),
  (
    'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    NULL,
    'Yadira Montero',
    5.0,
    'Sorpresa perfecta',
    'Le pedí una retro del Milan para mi esposo de cumpleaños. Las fotos reales antes de pagar me quitaron toda duda. Calidad igualita a la oficial — quedó loco. Repetiremos sin dudar.',
    'approved',
    5,
    now() - interval '21 days',
    now() - interval '21 days'
  ),
  -- Tied to Brasil 2002 local
  (
    'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    'prod_b44_697e9aab06307586',
    'Alejandro Pérez',
    5.0,
    'Vino para provincia y todo bien',
    'Para Camagüey siempre dudo, pero ellos me dieron código de seguimiento real y la camiseta llegó el día exacto que dijeron. La calidad la veo igual que la versión oficial — costuras, escudo bien aplicado, el amarillo idéntico. Recomendado.',
    'approved',
    12,
    now() - interval '9 days',
    now() - interval '9 days'
  ),
  -- Tied to Bufanda Barcelona
  (
    'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    'prod_b44_697eaa3d640ece0e',
    'Laura Castillo',
    4.5,
    'La bufanda llegó rápido',
    'Pedí la bufanda del Barça para mi hijo. La textura está bien, los flecos firmes y el escudo bordado de verdad, no estampado. Una estrellita menos porque tardó un día más de lo previsto, pero me avisaron por WhatsApp.',
    'approved',
    3,
    now() - interval '5 days',
    now() - interval '5 days'
  ),
  -- General — Habana same-day vibe
  (
    'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    NULL,
    'Carlos Beltrán',
    5.0,
    'En La Habana en horas',
    'Pago por Zelle desde mi familia en Miami y la camiseta llegó a Centro Habana esa misma tarde. Mensajero serio, todo en orden. Esto no se ve en Cuba todos los días.',
    'approved',
    6,
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  -- General — slight critique to feel real
  (
    'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    NULL,
    'María Fernández',
    4.0,
    'Buen producto, mejor el trato',
    'Me sorprendió la atención por WhatsApp. Te confirman talla, te enseñan foto real y respondes rápido. La camiseta cumple — hubiera preferido el tono un poco más oscuro pero es preferencia mía. Ever responde a todo.',
    'approved',
    2,
    now() - interval '11 days',
    now() - interval '11 days'
  );

-- Sanity check
SELECT
  count(*) AS total,
  round(avg(rating)::numeric, 2) AS avg_rating,
  count(*) FILTER (WHERE product_id IS NOT NULL) AS attached_to_product,
  count(*) FILTER (WHERE product_id IS NULL) AS general
FROM reviews;
