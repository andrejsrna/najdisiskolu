-- Rakovice: odstráni druhú, historicky zdvojenú kópiu partnerstiev.
UPDATE "School"
SET "partners" = regexp_replace(
  "partners",
  E'\\nSpolupracujeme[\\s\\S]*$',
  ''
)
WHERE "slug" = 'stredna-odborna-skola-regionalneho-rozvoja-a-stredna-odborna-skola-zahradnicka'
  AND "partners" ~ E'\\nSpolupracujeme';
