-- Mark "featured = true" on products that the average customer actually
-- buys (based on global trends, not yupoo data — yupoo has no sales).
-- Featured products show first on the home with a "Destacado" badge.

-- 1. Reset everything yupoo first so re-runs don't accumulate.
UPDATE products SET featured = false WHERE id LIKE 'prod_yp_%';

-- 2. Star players (any product whose name mentions these surfaces).
UPDATE products SET featured = true WHERE id LIKE 'prod_yp_%' AND status != 'archived' AND lower(name) ~ '(messi|ronaldo|mbapp|vinicius|neymar|yamal|bellingham|haaland|modric|pedri|vitinha|lewandowski|kane|salah|son heung|de bruyne|lebron|curry|jordan|kobe|doncic|tatum|giannis|embiid|brunson|edwards|gilgeous|sga|mitchell|halliburton|haliburton|siakam|antetokounmpo|durant)';

-- 3. Top national teams.
UPDATE products SET featured = true WHERE id LIKE 'prod_yp_%' AND status != 'archived' AND lower(name) ~ '(argentina|brasil|francia|france|inglaterra|england|españa|spain|portugal|alemania|germany|italia|italy|marruecos|morocco|croacia|croatia|holanda|netherlands|belgica|belgium|mexico|méxico|japon|japón|cuba)';

-- 4. Top clubs.
UPDATE products SET featured = true WHERE id LIKE 'prod_yp_%' AND status != 'archived' AND lower(name) ~ '(real madrid|r mad|barcelona|fcb|atletico|atlético|manchester|mnu|mci|liverpool|arsenal|chelsea|tottenham|paris saint|psg|bayern|dortmund|juventus|juve|inter milan|ac milan|napoli|boca|river plate|flamengo|palmeiras|santos|inter miami)';

-- 5. NBA top teams.
UPDATE products SET featured = true WHERE id LIKE 'prod_yp_%' AND status != 'archived' AND lower(name) ~ '(lakers|bulls|warriors|celtics|heat|knicks|76ers|sixers|mavericks|bucks|thunder|nuggets)';

-- 6. Retro and kids — both niches that always sell.
UPDATE products SET featured = true WHERE id LIKE 'prod_yp_%' AND status != 'archived' AND lower(name) ~ '(retro|vintage|classic|legends)';
UPDATE products SET featured = true WHERE id LIKE 'prod_yp_%' AND status != 'archived' AND lower(name) ~ '(niños|niño|kids|kid|youth|juvenil|bebé)';

-- Result.
SELECT
  count(*) FILTER (WHERE featured) AS destacados,
  count(*) FILTER (WHERE NOT featured AND status != 'archived') AS no_destacados,
  count(*) FILTER (WHERE status = 'archived') AS archivados
FROM products WHERE id LIKE 'prod_yp_%';
