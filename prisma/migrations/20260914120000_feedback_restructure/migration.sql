-- Zjednodušenie vstupov podľa feedbacku: INEKO čísla+kategória, viac webov,
-- Erasmus krajiny, bezbariérovosť a typ internátu ako dropdowny, highlighty školy.

-- 1) INEKO: rozobrať voľný text („7. zo všetkých, 3. z odborných škôl") na číslo + kategóriu
ALTER TABLE "School" ADD COLUMN "inekoKrajRank" INTEGER;
ALTER TABLE "School" ADD COLUMN "inekoKrajOf" TEXT;
ALTER TABLE "School" ADD COLUMN "inekoSkRank" INTEGER;
ALTER TABLE "School" ADD COLUMN "inekoSkOf" TEXT;

-- číselné „5" / „6" (bez bodky a kategórie) považujeme za poradie v kraji zo všetkých
UPDATE "School" SET
  "inekoKrajRank" = (regexp_match("inekoKraj", '^\s*(\d+)'))[1]::int,
  "inekoKrajOf"   = 'zo všetkých'
WHERE "inekoKraj" ~ '^\s*\d+\s*$';

UPDATE "School" SET
  "inekoKrajRank" = (regexp_match("inekoKraj", '(\d+)\s*\.\s*z'))[1]::int,
  "inekoKrajOf"   = 'z ' || trim(split_part(split_part("inekoKraj", ',', 2), ',', 1), ' .')
WHERE "inekoKraj" ~ '\d+\s*\.\s*zo?\s' AND "inekoKrajOf" IS NULL;

-- jediná hodnota bez čiarky (napr. „5. zo všetkých") → kategória zo všetkých
UPDATE "School" SET
  "inekoKrajOf" = 'zo všetkých'
WHERE "inekoKraj" ~ '^\s*\d+\s*\.\s*zo všetkých' AND "inekoKrajOf" IS NULL;

UPDATE "School" SET
  "inekoSkRank" = (regexp_match("inekoSlovensko", '^\s*(\d+)'))[1]::int,
  "inekoSkOf"   = 'zo všetkých'
WHERE "inekoSlovensko" ~ '^\s*\d+\s*$';

UPDATE "School" SET
  "inekoSkRank" = (regexp_match("inekoSlovensko", '(\d+)\s*\.\s*z'))[1]::int,
  "inekoSkOf"   = 'z ' || trim(split_part(split_part("inekoSlovensko", ',', 2), ',', 1), ' .')
WHERE "inekoSlovensko" ~ '\d+\s*\.\s*zo?\s' AND "inekoSkOf" IS NULL;

UPDATE "School" SET
  "inekoSkOf" = 'zo všetkých'
WHERE "inekoSlovensko" ~ '^\s*\d+\s*\.\s*zo všetkých' AND "inekoSkOf" IS NULL;

ALTER TABLE "School" DROP COLUMN "inekoKraj";
ALTER TABLE "School" DROP COLUMN "inekoSlovensko";

-- 2) Viac webov: „www.a.sk, www.b.sk" → websites[]
ALTER TABLE "School" ADD COLUMN websites TEXT[];
UPDATE "School" SET websites = CASE
  WHEN website IS NULL OR trim(website) = '' THEN '{}'
  ELSE (
    SELECT array_agg(DISTINCT w)
    FROM unnest(string_to_array(replace(website, ' ', ''), ',')) AS w
    WHERE trim(w) <> ''
  )
END;
ALTER TABLE "School" DROP COLUMN website;

-- 3) Erasmus krajiny (dropdown, „Žiadne" = prázdne pole)
ALTER TABLE "School" ADD COLUMN "erasmusCountries" TEXT[];

-- 4) Typ internátu
ALTER TABLE "School" ADD COLUMN "internatType" TEXT;

-- 5) Highlighty (maturita / výučný list ako checkboxy)
ALTER TABLE "School" ADD COLUMN "hasMaturita" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "School" ADD COLUMN "hasVl" BOOLEAN NOT NULL DEFAULT false;

-- odvodenie z odborov
UPDATE "School" s SET "hasMaturita" = sub.m FROM (
  SELECT "schoolId", bool_or("completion" IN ('MATURITA','MATURITA_A_VYUCNY_LIST')) AS m
  FROM "Odbor" GROUP BY "schoolId"
) sub WHERE s.id = sub."schoolId" AND sub.m;

UPDATE "School" s SET "hasVl" = sub.v FROM (
  SELECT "schoolId", bool_or("completion" IN ('VYUCNY_LIST','MATURITA_A_VYUCNY_LIST')) AS v
  FROM "Odbor" GROUP BY "schoolId"
) sub WHERE s.id = sub."schoolId" AND sub.v;

-- 6) Bezbariérovosť zjednodušiť na Áno / Čiastočne / Nie
UPDATE "School" SET accessibility = CASE
  WHEN accessibility IS NULL THEN NULL
  WHEN lower(accessibility) LIKE 'áno%' THEN 'Áno'
  WHEN lower(accessibility) LIKE 'čiasto%' THEN 'Čiastočne'
  WHEN lower(accessibility) LIKE 'nie%' THEN 'Nie'
  ELSE NULL
END;
