// List all objects under a prefix in the S3 bucket (SigV4 GET ?list-type=2).
import crypto from "crypto";

function requiredEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
const cfg = {
  endpoint: requiredEnv("S3_ENDPOINT").replace(/\/$/, ""),
  bucket: requiredEnv("S3_BUCKET"),
  accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
  secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
  region: process.env.S3_REGION?.trim() || "us-east-1",
};

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}
function signingKey(secret: string, date: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}
function amzDateParts(d: Date) {
  const compact = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: compact, date: compact.slice(0, 8) };
}

async function listObjects(prefix: string, continuationToken?: string): Promise<{ keys: string[]; lastModified: Record<string, string>; nextToken?: string }> {
  const host = new URL(cfg.endpoint).host;
  const path = `/${cfg.bucket}/`;
  const params: [string, string][] = [
    ["list-type", "2"],
    ["prefix", prefix],
    ["max-keys", "1000"],
  ];
  if (continuationToken) params.push(["continuation-token", continuationToken]);
  params.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const canonicalQuery = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const payloadHash = sha256Hex(Buffer.alloc(0));
  const { amzDate, date } = amzDateParts(new Date());
  const canonicalHeaders = `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["GET", path, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/${cfg.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(Buffer.from(canonicalRequest, "utf8"))].join("\n");
  const signature = hmac(signingKey(cfg.secretAccessKey, date, cfg.region), stringToSign).toString("hex");

  const res = await fetch(`${cfg.endpoint}${path}?${canonicalQuery}`, {
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  });
  if (!res.ok) throw new Error(`List zlyhal (${res.status}): ${await res.text()}`);
  const xml = await res.text();
  const keys: string[] = [];
  const lastModified: Record<string, string> = {};
  const contentsRe = /<Contents>([\s\S]*?)<\/Contents>/g;
  let m;
  while ((m = contentsRe.exec(xml))) {
    const block = m[1];
    const keyMatch = /<Key>(.*?)<\/Key>/.exec(block);
    const lmMatch = /<LastModified>(.*?)<\/LastModified>/.exec(block);
    if (keyMatch) {
      const key = keyMatch[1];
      keys.push(key);
      if (lmMatch) lastModified[key] = lmMatch[1];
    }
  }
  const nextTokenMatch = /<NextContinuationToken>(.*?)<\/NextContinuationToken>/.exec(xml);
  return { keys, lastModified, nextToken: nextTokenMatch?.[1] };
}

async function main() {
  const prefix = process.argv[2] || "skoly/";
  let token: string | undefined;
  const all: { key: string; lastModified: string }[] = [];
  do {
    const { keys, lastModified, nextToken } = await listObjects(prefix, token);
    for (const k of keys) all.push({ key: k, lastModified: lastModified[k] });
    token = nextToken;
  } while (token);
  all.sort((a, b) => (a.lastModified < b.lastModified ? -1 : 1));
  for (const { key, lastModified } of all) {
    console.log(`${lastModified}\t${key}`);
  }
  console.error(`\nTotal: ${all.length} objects`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
