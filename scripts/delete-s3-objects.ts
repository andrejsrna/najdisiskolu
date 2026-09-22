// Zmaže zoznam S3 objektov (kľúčov) zo súboru, jeden kľúč na riadok (voliteľne s tabom pred kľúčom).
import fs from "fs";
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
function encodedKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

async function deleteObject(key: string): Promise<void> {
  const host = new URL(cfg.endpoint).host;
  const path = `/${cfg.bucket}/${encodedKey(key)}`;
  const payloadHash = sha256Hex(Buffer.alloc(0));
  const { amzDate, date } = amzDateParts(new Date());
  const canonicalHeaders = `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["DELETE", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/${cfg.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(Buffer.from(canonicalRequest, "utf8"))].join("\n");
  const signature = hmac(signingKey(cfg.secretAccessKey, date, cfg.region), stringToSign).toString("hex");

  const res = await fetch(`${cfg.endpoint}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete zlyhal (${res.status}) pre ${key}: ${await res.text()}`);
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Použitie: tsx delete-s3-objects.ts <súbor_s_kľúčmi>");
    process.exit(1);
  }
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  const keys = lines.map((l) => {
    const parts = l.split("\t");
    return parts.length > 1 ? parts[1] : parts[0];
  });
  console.log(`Mažem ${keys.length} objektov...`);
  let ok = 0;
  for (const key of keys) {
    try {
      await deleteObject(key);
      ok += 1;
    } catch (e) {
      console.error(`❌ ${key}:`, (e as Error).message);
    }
  }
  console.log(`Hotovo: zmazaných ${ok}/${keys.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
