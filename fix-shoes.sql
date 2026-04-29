-- Fix remaining Chinese terms + populate brand + description for shoes.
-- Idempotent: re-running only changes what's still pending.

-- 1. Translate Chinese terms still present in names. Order matters
--    (more specific phrases first).
UPDATE products SET name = regexp_replace(name, '传奇', 'Tiempo', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '传奇';

UPDATE products SET name = regexp_replace(name, '猎人', 'Predator', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '猎人';

UPDATE products SET name = regexp_replace(name, '中端', 'Mid', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '中端';

UPDATE products SET name = regexp_replace(name, '高端', 'High-End', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '高端';

UPDATE products SET name = regexp_replace(name, '低端', 'Low-End', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '低端';

-- "高" alone (high-top), "低" alone (low-top), "中" alone (mid)
UPDATE products SET name = regexp_replace(name, '\m高\M', 'High', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '\m高\M';
UPDATE products SET name = regexp_replace(name, '\m低\M', 'Low', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '\m低\M';
UPDATE products SET name = regexp_replace(name, '\m中\M', 'Mid', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '\m中\M';

-- 帮 (collar) without prefix → drop
UPDATE products SET name = regexp_replace(name, '帮', '', 'g')
  WHERE id LIKE 'prod_yhc_%' AND name ~ '帮';

-- Whitespace cleanup after substitutions.
UPDATE products SET name = regexp_replace(trim(name), '\s+', ' ', 'g')
  WHERE id LIKE 'prod_yhc_%';

-- 2. Populate brand based on name keywords. Lowercase match for safety.
UPDATE products SET brand = 'Adidas'
  WHERE id LIKE 'prod_yhc_%'
    AND brand IS NULL
    AND lower(name) ~ '(adidas|\mx \d|predator|copa|samba|gazelle|gx|f50)';

UPDATE products SET brand = 'Nike'
  WHERE id LIKE 'prod_yhc_%'
    AND brand IS NULL
    AND lower(name) ~ '(nike|phantom|mercurial|tiempo|streetgato|premier|legend)';

UPDATE products SET brand = 'Puma'
  WHERE id LIKE 'prod_yhc_%'
    AND brand IS NULL
    AND lower(name) ~ '(puma|future|king|ultra)';

UPDATE products SET brand = 'JOMA'
  WHERE id LIKE 'prod_yhc_%'
    AND brand IS NULL
    AND lower(name) ~ '\mjoma\M';

UPDATE products SET brand = 'Genérica'
  WHERE id LIKE 'prod_yhc_%' AND brand IS NULL;

-- 3. Populate team field with the surface type (FG/SG/TF/IC/AG/MD)
--    so /tienda search picks it up. The team column is repurposed
--    here as a search-keyword bag; the public listing already
--    treats it as such for jerseys.
UPDATE products SET team = 'Botines FG'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~ '\mFG\M';
UPDATE products SET team = 'Botines SG'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~ '\mSG\M';
UPDATE products SET team = 'Botines TF'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~ '\mTF\M';
UPDATE products SET team = 'Botines AG'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~ '\mAG\M';
UPDATE products SET team = 'Botines IC'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~ '\mIC\M';
UPDATE products SET team = 'Botines MD'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~ '\mMD\M';
UPDATE products SET team = 'Pantuflas'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL AND name ~* '(slipper|pantufla)';
UPDATE products SET team = 'Calzado'
  WHERE id LIKE 'prod_yhc_%' AND team IS NULL;

-- 4. Generate a Spanish description if it's still the import marker.
--    Pulls the brand + name + the surface type so customers searching
--    for "puma fg" see something useful.
UPDATE products SET description =
  CASE
    WHEN team ~ 'Botines FG' THEN
      brand || ' ' || name || '. Botines de fútbol para terrenos firmes (FG). Calidad premium, importados por encargo. Confirma talla por WhatsApp antes del pago.'
    WHEN team ~ 'Botines SG' THEN
      brand || ' ' || name || '. Botines de fútbol para terrenos suaves/húmedos (SG). Calidad premium, importados por encargo. Confirma talla por WhatsApp antes del pago.'
    WHEN team ~ 'Botines TF' THEN
      brand || ' ' || name || '. Zapatillas de fútbol para césped artificial (TF). Calidad premium, importados por encargo. Confirma talla por WhatsApp antes del pago.'
    WHEN team ~ 'Botines AG' THEN
      brand || ' ' || name || '. Botines de fútbol para césped artificial (AG). Calidad premium, importados por encargo. Confirma talla por WhatsApp antes del pago.'
    WHEN team ~ 'Botines IC' THEN
      brand || ' ' || name || '. Zapatillas de fútbol sala/indoor (IC). Calidad premium, importados por encargo. Confirma talla por WhatsApp antes del pago.'
    WHEN team ~ 'Botines MD' THEN
      brand || ' ' || name || '. Botines multi-superficie. Calidad premium, importados por encargo. Confirma talla por WhatsApp antes del pago.'
    WHEN team ~ 'Pantuflas' THEN
      brand || ' ' || name || '. Pantuflas/sandalias deportivas. Importadas por encargo.'
    ELSE
      brand || ' ' || name || '. Calzado deportivo importado por encargo. Confirma talla por WhatsApp antes del pago.'
  END,
  updated_at = NOW()
  WHERE id LIKE 'prod_yhc_%' AND description ~ 'Importado de Yupoo';

-- 5. Final report.
SELECT brand, count(*) AS productos
  FROM products
  WHERE id LIKE 'prod_yhc_%'
  GROUP BY brand
  ORDER BY productos DESC;

SELECT team, count(*) AS productos
  FROM products
  WHERE id LIKE 'prod_yhc_%'
  GROUP BY team
  ORDER BY productos DESC;

-- Sample renamed products
SELECT name FROM products
  WHERE id LIKE 'prod_yhc_%'
    AND (name ~ '高' OR name ~ '低' OR name ~ '中' OR name ~ '帮' OR name ~ '传奇')
  LIMIT 10;
