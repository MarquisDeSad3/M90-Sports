-- Create dedicated categories for preorder products and auto-assign
-- yupoo-imported items by keyword matching their names. Idempotent —
-- re-runs replace assignments cleanly.
--
-- Order matters. We do the most-specific buckets first so the
-- subsequent inserts (which all have NOT IN clauses) don't double-tag.
-- In particular, Clubes runs BEFORE NBA so "Jordan PSG" / "Jordan
-- Barcelona" (the Nike Jordan × football brand collaborations) land
-- in Clubes instead of being grabbed by the NBA "jordan" keyword.

-- 1. Create the categories (one per bucket Ever cares about).
INSERT INTO categories (id, slug, name, description, position, visible, created_at, updated_at)
VALUES
  ('cat_enc_selecciones', 'encargo-selecciones', 'Selecciones (por encargo)',  'Selecciones nacionales por pedido',                             100, true, NOW(), NOW()),
  ('cat_enc_clubes',      'encargo-clubes',      'Clubes (por encargo)',       'Clubes y merchandise por pedido',                                110, true, NOW(), NOW()),
  ('cat_enc_nba',         'encargo-nba',         'NBA (por encargo)',          'NBA por pedido',                                                 120, true, NOW(), NOW()),
  ('cat_enc_retro',       'encargo-retro',       'Retro (por encargo)',        'Retro / vintage por pedido',                                     130, true, NOW(), NOW()),
  ('cat_enc_ninos',       'encargo-ninos',       'Niños (por encargo)',        'Tallas infantiles por pedido',                                   140, true, NOW(), NOW()),
  ('cat_enc_accesorios',  'encargo-accesorios',  'Accesorios (por encargo)',   'Polos, sudaderas, conjuntos de entrenamiento por pedido',        150, true, NOW(), NOW()),
  ('cat_enc_balones',     'encargo-balones',     'Balones (por encargo)',      'Balones y artículos similares por pedido',                       160, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Wipe any pre-existing assignments so re-running this file produces
--    a clean state.
DELETE FROM product_categories
WHERE category_id IN (
  'cat_enc_selecciones','cat_enc_clubes','cat_enc_nba','cat_enc_retro',
  'cat_enc_ninos','cat_enc_accesorios','cat_enc_balones'
);

-- 3. Niños — match "Niños/Niño/Kids/Youth/Bebé/Baby/Child" anywhere.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_ninos' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '\m(niños|niño|kid|kids|youth|juvenil|bebé|baby)\M';

-- 4. Retro — anything explicitly retro/vintage/classic.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_retro' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '\m(retro|vintage|classic|legends|anniversary|legend|edición limitada)\M'
  AND id NOT IN (
    SELECT product_id FROM product_categories WHERE category_id = 'cat_enc_ninos'
  );

-- 5. Balones — anything explicitly a ball/training ball.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_balones' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '\m(balón|balon|football ball|soccer ball|trionda|ball)\M';

-- 6. Clubes — match named clubs OR generic "fc/club/cf" patterns.
--    Runs BEFORE NBA on purpose: products like "Jordan PSG" should
--    land here as a football club item, not in NBA.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_clubes' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '(real madrid|\yr mad\y|barcelona|\yfcb\y|fc bayern|manchester|\ymnu\y|\ymci\y|liverpool|chelsea|\yche\y|arsenal|\yars\y|tottenham|paris saint|\ypsg\y|bayern|dortmund|juventus|juve|inter milan|ac milan|atletico|atlético|napoli|roma|lazio|ajax|psv|benfica|porto|boca|river plate|flamengo|palmeiras|santos|leverkusen|leipzig|monaco|valencia|sevilla|villarreal|betis|chivas|az alkmaar|hoffenheim|leeds|west ham|everton|newcastle|wolves|brighton|aston villa|fulham|inter miami|marseille|celtic|tigres|sao paulo|sunderland|colo colo|maccabi|aniquiladores|club nacional|gremio|millonarios|olimpia|sporting|red bull|cavaliers|cd universidad|club deportivo|real sociedad|elche fc|albacete|leganes|osasuna|real zaragoza|hannover|wolfsburg|st\\. pauli)'
  AND id NOT IN (
    SELECT product_id FROM product_categories
    WHERE category_id IN ('cat_enc_ninos','cat_enc_retro')
  );

-- 7. NBA — any NBA team or player name. Skips anything already tagged
--    as a football club so brand collabs like "Jordan PSG" don't end
--    up here.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_nba' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '(lakers|bulls|warriors|celtics|heat|knicks|76ers|sixers|mavericks|spurs|suns|bucks|nuggets|clippers|timberwolves|pelicans|magic|pacers|cavaliers|thunder|rockets|grizzlies|trail blazers|hawks|hornets|pistons|raptors|wizards|jazz|nba|all-star|all star|lebron|curry|jordan|kobe|doncic|tatum|giannis|antetokounmpo|embiid|brunson|edwards|gilgeous|harden|haliburton|halliburton|siakam|durant)'
  AND id NOT IN (
    SELECT product_id FROM product_categories
    WHERE category_id IN ('cat_enc_ninos','cat_enc_retro','cat_enc_clubes')
  );

-- 8. Selecciones — country names. Skips already-tagged products.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_selecciones' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '(argentina|brasil|brazil|francia|france|inglaterra|england|españa|spain|portugal|alemania|germany|italia|italy|holanda|netherlands|bélgica|belgium|belgica|croacia|croatia|méxico|mexico|marruecos|morocco|sudáfrica|south africa|colombia|chile|peru|perú|uruguay|paraguay|venezuela|ecuador|panamá|panama|cuba|japón|japan|corea|korea|gales|wales|escocia|scotland|irlanda|ireland|argelia|algeria|nigeria|senegal|ghana|cameroon|tunisia|saudi|qatar|usa|canadá|canada|noruega|norway|suecia|sweden|dinamarca|denmark|polonia|poland|austria|serbia|suiza|switzerland|turquía|turkey|honduras|costa rica|guatemala|el salvador|jamaica|haiti|paraguay|puerto rico|venezuela|bosnia)'
  AND id NOT IN (
    SELECT product_id FROM product_categories
    WHERE category_id IN ('cat_enc_ninos','cat_enc_retro','cat_enc_clubes','cat_enc_nba')
  );

-- 9. Accesorios — anything left that's polo/hoodie/training/vest/etc.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_accesorios' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND lower(name) ~ '(polo|sudadera|hoodie|chaleco|vest|entrenamiento|training|conjunto|suit|chaqueta|jacket|abrigo|coat|windbreaker|crop top|shorts|pantalón|pants|cardigan|polo)'
  AND id NOT IN (
    SELECT product_id FROM product_categories
    WHERE category_id IN ('cat_enc_ninos','cat_enc_retro','cat_enc_selecciones','cat_enc_nba','cat_enc_clubes','cat_enc_balones')
  );

-- 10. Final report.
SELECT
  c.name,
  count(*) AS productos
FROM product_categories pc
JOIN categories c ON c.id = pc.category_id
WHERE pc.category_id LIKE 'cat_enc_%'
GROUP BY c.id, c.name
ORDER BY c.position;

SELECT count(*) AS sin_categoria_preorder
FROM products
WHERE id LIKE 'prod_yp_%' AND status != 'archived'
  AND id NOT IN (
    SELECT product_id FROM product_categories WHERE category_id LIKE 'cat_enc_%'
  );
