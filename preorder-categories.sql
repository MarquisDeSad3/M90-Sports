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
  ('cat_enc_selecciones', 'encargo-selecciones', 'Selecciones',  'Selecciones nacionales por pedido',                             100, true, NOW(), NOW()),
  ('cat_enc_clubes',      'encargo-clubes',      'Clubes',       'Clubes y merchandise por pedido',                                110, true, NOW(), NOW()),
  ('cat_enc_nba',         'encargo-nba',         'NBA',          'NBA por pedido',                                                 120, true, NOW(), NOW()),
  ('cat_enc_retro',       'encargo-retro',       'Retro',        'Retro / vintage por pedido',                                     130, true, NOW(), NOW()),
  ('cat_enc_ninos',       'encargo-ninos',       'Niños',        'Tallas infantiles por pedido',                                   140, true, NOW(), NOW()),
  ('cat_enc_accesorios',  'encargo-accesorios',  'Accesorios',   'Polos, sudaderas, conjuntos de entrenamiento por pedido',        150, true, NOW(), NOW()),
  ('cat_enc_balones',     'encargo-balones',     'Balones',      'Balones y artículos similares por pedido',                       160, true, NOW(), NOW()),
  ('cat_enc_otros',       'encargo-otros',       'Otros',        'Productos que no entran en las otras colecciones',               170, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 1b. Make sure every encargo-* category is parented under "Por encargo"
--     (idempotent — also fixes any new ones created in step 1 above).
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'por-encargo'),
    updated_at = NOW()
WHERE slug LIKE 'encargo-%'
  AND (parent_id IS NULL OR parent_id <> (SELECT id FROM categories WHERE slug = 'por-encargo'));

-- 2. Wipe any pre-existing assignments so re-running this file produces
--    a clean state.
DELETE FROM product_categories
WHERE category_id IN (
  'cat_enc_selecciones','cat_enc_clubes','cat_enc_nba','cat_enc_retro',
  'cat_enc_ninos','cat_enc_accesorios','cat_enc_balones','cat_enc_otros'
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
  AND lower(name) ~ '(real madrid|\yr mad\y|barcelona|\yfcb\y|\ybar\y|fc bayern|manchester|\ymnu\y|\ymci\y|\ymufc\y|\ymcfc\y|liverpool|\yliv\y|chelsea|\yche\y|arsenal|\yars\y|tottenham|\ytot\y|paris saint|\ypsg\y|bayern|\ybay\y|dortmund|\ybvb\y|juventus|juve|\yjuv\y|inter milan|ac milan|\yacm\y|atletico|atlético|\yatm\y|\yatl\y|napoli|roma|lazio|atalanta|fiorentina|sassuolo|torino|udinese|genoa|bologna|empoli|cagliari|verona|salernitana|cremonese|parma|lecce|spezia|sampdoria|frosinone|como 1907|ajax|psv|feyenoord|benfica|porto|sporting|boca|river plate|flamengo|palmeiras|santos|leverkusen|leipzig|monaco|valencia|sevilla|villarreal|betis|espanyol|real sociedad|athletic|getafe|levante|mallorca|cádiz|cadiz|granada|las palmas|rayo vallecano|celta|chivas|cruz azul|club león|leon mexico|pumas|america 20|america sub|club américa|tigres|monterrey|toluca|pachuca|atlas mexico|santos laguna|az alkmaar|hoffenheim|leeds|west ham|everton|newcastle|nottingham|nottm forest|crystal palace|wolves|brighton|aston villa|fulham|brentford|burnley|bournemouth|sheffield|norwich|watford|inter miami|la galaxy|lafc|seattle sounders|nashville sc|austin fc|portland timbers|marseille|\yom\y|lyon|\yol\y|lille|nice|rennes|stade brestois|saint.etienne|monaco|nantes|toulouse|montpellier|strasbourg|metz|reims|celtic|rangers|tigres|sao paulo|sunderland|colo colo|maccabi|aniquiladores|club nacional|gremio|millonarios|olimpia|sporting|red bull|cavaliers|cd universidad|club deportivo|real sociedad|elche fc|albacete|leganes|osasuna|real zaragoza|hannover|wolfsburg|st\\. pauli|hertha|union berlin|mainz|fc köln|fc koln|köln|koln|stuttgart|werder bremen|eintracht|frankfurt|schalke|hamburg|hamburger|hsv|m.nchengladbach|gladbach|borussia|fluminense|botafogo|cruzeiro|internacional|vasco|atletico mineiro|atlético mineiro|fortaleza|corinthians|talleres|estudiantes|independiente|velez|racing club|al ittihad|al hilal|al nassr|al ahli|al shabab|al ettifaq|nasr saudi|al duhail|al sadd|kashima|kashima antlers|urawa|fc tokyo|gamba osaka|cerezo|kawasaki frontale|yokohama|ulsan|jeonbuk|seoul fc|maccabi|hapoel|olympiacos|panathinaikos|paok|aek|saprissa|alajuelense|herediano|cartagines|palestino|colo|universidad de chile|universidad católica|nacional uruguay|peñarol|wanderers|defensor|river plate uruguay|orlando city|fc cincinnati|new england revolution|columbus crew|chicago fire|colorado rapids|fc dallas|d\\.c\\. united|new york red bulls|new york city|toronto fc|montreal impact|cf montréal|vancouver whitecaps|sporting kansas|real salt lake|houston dynamo|san jose earthquakes|st\\. louis city|charlotte fc|miami fc|cincinnati|nashville|ferrari|alpine f1|mclaren|mercedes f1|red bull racing|aston martin f1)'
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
  AND lower(name) ~ '(argentina|brasil|brazil|francia|france|inglaterra|england|españa|spain|portugal|alemania|germany|italia|italy|holanda|netherlands|bélgica|belgium|belgica|croacia|croatia|méxico|mexico|marruecos|morocco|sudáfrica|south africa|colombia|chile|peru|perú|uruguay|paraguay|venezuela|ecuador|panamá|panama|cuba|japón|japan|corea|korea|gales|wales|escocia|scotland|irlanda|ireland|argelia|algeria|nigeria|senegal|ghana|cameroon|tunisia|saudi|qatar|usa|canadá|canada|noruega|norway|suecia|sweden|dinamarca|denmark|polonia|poland|austria|serbia|suiza|switzerland|turquía|turkey|honduras|costa rica|guatemala|el salvador|jamaica|haiti|paraguay|puerto rico|venezuela|bosnia|china|india|indonesia|filipinas|philippines|vietnam|thailand|tailandia|australia|new zealand|nueva zelanda|iran|iraq|israel|palestine|palestina|jordan|líbano|lebanon|syria|siria|costa de marfil|ivory coast|south korea|north korea|república dominicana|dominican|trinidad|honduras|nicaragua|el salvador|guatemala|bolivia|albania|grecia|greece|hungría|hungary|república checa|czech|eslovaquia|slovakia|eslovenia|slovenia|rumania|romania|bulgaria|finland|finlandia|islandia|iceland|estonia|letonia|latvia|lituania|lithuania|república democrática|dr congo|drc|nigeria|kenya|kenia|tanzania|burkina|mali|libya|libia|egypt|egipto|sudán|sudan|chad|niger|guinea|comoros|botswana|namibia|gabon|congo)'
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

-- 9a. Otros — catch-all for everything that didn't match a specific
--     bucket. Runs last so it picks up only what the rest left behind.
INSERT INTO product_categories (product_id, category_id)
SELECT id, 'cat_enc_otros' FROM products
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND id NOT IN (
    SELECT product_id FROM product_categories
    WHERE category_id IN (
      'cat_enc_ninos','cat_enc_retro','cat_enc_balones','cat_enc_clubes',
      'cat_enc_nba','cat_enc_selecciones','cat_enc_accesorios'
    )
  );

-- 9b. Archive obvious SKU-only garbage products (names that are pure
--     codes with no recognizable team/player). These can't be sold —
--     no customer searches for "L722# S-2XL" or "8106".
UPDATE products SET status = 'archived', updated_at = NOW()
WHERE id LIKE 'prod_yp_%'
  AND status != 'archived'
  AND (
    -- Names that are essentially just SKU codes
    lower(name) ~ '^[a-z]{0,3}[0-9]{3,}\\W*\\W?(s-|m-|l-|xl-|xxl-|size|talla|2xl|3xl|4xl|5xl|6xl|7xl)?[\\W\\d-]{0,15}$'
    -- Pure numeric / hash SKUs
    OR lower(name) ~ '^[\\d#\\s\\-\\.x]+$'
    -- Generic "high quality leggings adults" type catch-alls
    OR lower(name) ~ '^high quality '
    OR lower(name) ~ '^[a-z]+ #?\\d+ [a-z]+ [a-z]+$'  -- "Adidas #1033 Royal Azul"
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
