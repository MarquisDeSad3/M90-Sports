-- v3 — final classifier. Includes club abbreviations + soft-matcher
-- "polo/hoodie/training" since those are valid merchandise.

WITH classified AS (
  SELECT
    id, name,
    CASE
      WHEN name ~ '[\u4e00-\u9fff]' THEN 'archivar:chino'

      -- Hard archive: clearly not jerseys nor team merchandise
      WHEN lower(name) ~ '(keychain|backpack|down jacket|windbreak|coats and|hoodie sweater|football shoes|running shoes|soccer boots|beanie|cap collection|hat collection|pants and shorts|track suit|jacket and pants|m92 maya|lyndale|cleats only|moose knuckles|tang-style|chinese new year|hair collar)' THEN 'archivar:accesorio'

      -- Anything jersey-like
      WHEN lower(name) ~ '(jersey|kit|shirt|world cup|player version|fan version|long sleeves|short sleeves|soccer|football jers|rugby|f1 jersey|nfl|kbo|mlb|nba|ncaa|goalkeeper| gk )' THEN 'keep:jersey'

      -- Team merchandise (polo, hoodie, training, vest, polo of a known team)
      WHEN lower(name) ~ '(polo|hoodie|training|vest|half zipper|special edition|special version|away|home|alternate)' THEN 'keep:merch'

      -- Selecciones (extended)
      WHEN lower(name) ~ '(brazil|brasil|argentina|spain|espa|germany|alemania|france|francia|england|inglaterra|portugal|italy|italia|netherlands|holanda|belgium|belgica|croatia|croacia|mexico|usa|cuba|uruguay|japan|japon|morocco|marruecos|colombia|chile|peru|korea|senegal|saudi|qatar|wales|scotland|ireland|denmark|sweden|norway|switzerland|poland|austria|serbia|turkey|paraguay|venezuela|ecuador|panama|algeria|south africa|nigeria|cameroon|ghana|tunisia|honduras|costa rica|el salvador|guatemala)' THEN 'keep:seleccion'

      -- Clubes + abbreviations
      WHEN lower(name) ~ '(real madrid|madrid|barcelona|manchester|liverpool|chelsea|arsenal|tottenham|paris saint|psg|bayern|dortmund|juventus|juve|inter milan|ac milan|atletico|napoli|roma|lazio|ajax|psv|benfica|porto|boca|river plate|flamengo|palmeiras|santos|leverkusen|leipzig|monaco|valencia|sevilla|villarreal|betis|fcb|fc bayern|chivas|az alkmaar|hoffenheim|leeds|west ham|everton|newcastle|wolves|brighton|aston villa|fulham|inter miami|marseille|celtic|tigres|sao paulo|sunderland|colo colo|maccabi|aniquiladores|club nacional|america 20|r mad|che 20|mnu 20|mci 20|ars 20|liv 20|bar 20|atm 20|nap 20|juv 20|mil 20|int 20)' THEN 'keep:club'

      WHEN lower(name) ~ '(lakers|bulls|warriors|heat|celtics|knicks|nets|76ers|sixers|mavericks|spurs|suns|bucks|nuggets|clippers|timberwolves|pelicans|magic|pacers|cavaliers|thunder|rockets|grizzlies|trail blazers|hawks|hornets|pistons|raptors|wizards|jazz|all-star|all star)' THEN 'keep:nba'
      WHEN lower(name) ~ '(yankees|red sox|dodgers|mets|cubs|cardinals|astros|braves|orioles|baseball|beisbol|pelota)' THEN 'keep:mlb'
      WHEN lower(name) ~ '(retro|vintage|classic|legends)' THEN 'keep:retro'
      WHEN lower(name) ~ '(kids|niños|child|youth)' THEN 'keep:kids'

      ELSE 'revisar'
    END AS bucket
  FROM products WHERE id LIKE 'prod_yp_%'
)
SELECT bucket, count(*) FROM classified GROUP BY bucket ORDER BY count(*) DESC;
