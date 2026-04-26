-- Run each replacement as its own UPDATE. Slower than nesting them, but
-- 100% predictable — each rule actually runs and returns its row count.

-- Phrases first (longest → shortest order matters).
UPDATE products SET name = regexp_replace(name, 'Long Sleeves Soccer Jersey', 'Camiseta Manga Larga', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Long Sleeve Soccer Jersey',  'Camiseta Manga Larga', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Short Sleeves Soccer Jersey','Camiseta Manga Corta', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Short Sleeve Soccer Jersey', 'Camiseta Manga Corta', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Long Sleeves',               'Manga Larga', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Long Sleeve',                'Manga Larga', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Short Sleeves',              'Manga Corta', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Short Sleeve',               'Manga Corta', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Soccer Jersey',              'Camiseta', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Football Jersey',            'Camiseta', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Player Version',             'Versión Jugador', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Fan Version',                'Versión Fan', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Special Edition',            'Edición Especial', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Special Version',            'Edición Especial', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'City Edition',               'Edición Ciudad', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Limited Edition',            'Edición Limitada', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'World Cup',                  'Mundial', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Pre-Match',                  'Pre-Partido', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Training Suit',              'Conjunto Entrenamiento', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Hoodie Suit',                'Sudadera Conjunto', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Vest Suit',                  'Chaleco Conjunto', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Half zipper',                'Media Cremallera', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'All Sponsors',               'Todos Sponsors', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Goalkeeper',                 'Portero', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Hooded Jacket',              'Chaqueta con Capucha', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Down Jacket',                'Chaqueta Plumas', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Long Cotton Coats',          'Abrigos de Algodón', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Casual Shirts',              'Camisas Casuales', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, 'Casual Shirt',               'Camisa Casual', 'gi') WHERE id LIKE 'prod_yp_%';

-- Single words with word boundary (\m start, \M end).
UPDATE products SET name = regexp_replace(name, '\mGK\M',         'Portero', 'g')   WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mHome\M',       'Local', 'gi')    WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mAway\M',       'Visitante', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mThird\M',      'Tercera', 'gi')   WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mFourth\M',     'Cuarta', 'gi')    WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mAlternate\M',  'Alterna', 'gi')   WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mJersey\M',     'Camiseta', 'gi')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mShirt\M',      'Camiseta', 'gi')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mShorts\M',     'Shorts', 'gi')    WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mPants\M',      'Pantalón', 'gi')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mHoodie\M',     'Sudadera', 'gi')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mHoodies\M',    'Sudaderas', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mPolo\M',       'Polo', 'gi')      WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mVest\M',       'Chaleco', 'gi')   WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mSuit\M',       'Conjunto', 'gi')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mTraining\M',   'Entrenamiento', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mKids\M',       'Niños', 'gi')     WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mKid\M',        'Niño', 'gi')      WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mYouth\M',      'Juvenil', 'gi')   WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mAdult\M',      'Adulto', 'gi')    WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mWomen\M',      'Mujer', 'gi')     WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mWoman\M',      'Mujer', 'gi')     WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mMens\M',       'Hombre', 'gi')    WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mBaby\M',       'Bebé', 'gi')      WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mLight\M',      'Claro', 'gi')     WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mDark\M',       'Oscuro', 'gi')    WHERE id LIKE 'prod_yp_%';

-- Colors.
UPDATE products SET name = regexp_replace(name, '\mBlack\M',  'Negro',    'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mWhite\M',  'Blanco',   'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mRed\M',    'Rojo',     'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mBlue\M',   'Azul',     'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mYellow\M', 'Amarillo', 'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mPink\M',   'Rosa',     'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mGreen\M',  'Verde',    'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mPurple\M', 'Morado',   'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mGray\M',   'Gris',     'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mGrey\M',   'Gris',     'gi') WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mOrange\M', 'Naranja',  'gi') WHERE id LIKE 'prod_yp_%';

-- Countries.
UPDATE products SET name = regexp_replace(name, '\mBrazil\M',      'Brasil',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mSpain\M',       'España',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mGermany\M',     'Alemania',   'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mFrance\M',      'Francia',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mEngland\M',     'Inglaterra', 'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mItaly\M',       'Italia',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mNetherlands\M', 'Holanda',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mBelgium\M',     'Bélgica',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mCroatia\M',     'Croacia',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mMexico\M',      'México',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mMorocco\M',     'Marruecos',  'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mSouth Africa\M','Sudáfrica',  'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mTurkey\M',      'Turquía',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mJapan\M',       'Japón',      'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mKorea\M',       'Corea',      'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mWales\M',       'Gales',      'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mScotland\M',    'Escocia',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mIreland\M',     'Irlanda',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mAlgeria\M',     'Argelia',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mNigeria\M',     'Nigeria',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mPanama\M',      'Panamá',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mCanada\M',      'Canadá',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mNorway\M',      'Noruega',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mSweden\M',      'Suecia',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mDenmark\M',     'Dinamarca',  'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mPoland\M',      'Polonia',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mAustria\M',     'Austria',    'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mSerbia\M',      'Serbia',     'g')  WHERE id LIKE 'prod_yp_%';
UPDATE products SET name = regexp_replace(name, '\mSwitzerland\M', 'Suiza',      'g')  WHERE id LIKE 'prod_yp_%';

-- Description tag.
UPDATE products SET description = 'Producto por encargo · Importado bajo pedido. Llega entre 15 y 25 días.'
WHERE id LIKE 'prod_yp_%';

-- Final sanity check.
SELECT
  count(*) FILTER (WHERE name ~ '\mJersey\M')  AS jersey_left,
  count(*) FILTER (WHERE name ~ '\mAway\M')    AS away_left,
  count(*) FILTER (WHERE name ~ '\mHome\M')    AS home_left,
  count(*) FILTER (WHERE name ~ '\mShirt\M')   AS shirt_left
FROM products WHERE id LIKE 'prod_yp_%';

SELECT name FROM products WHERE id LIKE 'prod_yp_%' AND status = 'draft' ORDER BY random() LIMIT 10;
