WITH embedded AS (
  SELECT "postId", string_agg('<p><img src="' || url || '" /></p>', '' ORDER BY sort) AS html
  FROM "PostImage"
  GROUP BY "postId"
)
UPDATE "Post" p
SET body = COALESCE(p.body, '') || E'\n' || embedded.html
FROM embedded
WHERE p.id = embedded."postId"
  AND p.body NOT LIKE '%<img src="%';

DELETE FROM "PostImage";
