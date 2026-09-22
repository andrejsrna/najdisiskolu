import "server-only";

type StorageConfig = {
  endpoint: string;
  publicUrl: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

const encoder = new TextEncoder();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Chýba konfigurácia úložiska: ${name}`);
  return value;
}

function getConfig(): StorageConfig {
  return {
    endpoint: requiredEnv("S3_ENDPOINT").replace(/\/$/, ""),
    publicUrl: requiredEnv("S3_PUBLIC_URL").replace(/\/$/, ""),
    bucket: requiredEnv("S3_BUCKET"),
    accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    region: process.env.S3_REGION?.trim() || "us-east-1",
  };
}

function buffer(input: Uint8Array): ArrayBuffer {
  return input.slice().buffer;
}

async function sha256(input: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer(input));
  return Buffer.from(digest).toString("hex");
}

async function hmac(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    buffer(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value)));
}

async function signingKey(secret: string, date: string, region: string): Promise<Uint8Array> {
  const dateKey = await hmac(encoder.encode(`AWS4${secret}`), date);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function encodedKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function amzDateParts(date: Date) {
  const compact = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: compact, date: compact.slice(0, 8) };
}

export async function uploadPublicImage(file: File, key: string): Promise<string> {
  const config = getConfig();
  const payload = new Uint8Array(await file.arrayBuffer());
  const payloadHash = await sha256(payload);
  const { amzDate, date } = amzDateParts(new Date());
  const endpoint = new URL(config.endpoint);
  const path = `/${config.bucket}/${encodedKey(key)}`;
  const host = endpoint.host;
  const contentType = file.type;
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256(encoder.encode(canonicalRequest)),
  ].join("\n");
  const signature = Buffer.from(await hmac(await signingKey(config.secretAccessKey, date, config.region), stringToSign)).toString("hex");

  const response = await fetch(`${config.endpoint}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: payload as BodyInit,
  });

  if (!response.ok) {
    throw new Error(`Nahratie fotografie zlyhalo (${response.status}).`);
  }

  return `${config.publicUrl}/${encodedKey(key)}`;
}

/** Ako uploadPublicImage, ale s bufferom + typom obsahu priamo (napr. po kompresii). */
export async function uploadPublicBuffer(
  payloadInput: Uint8Array,
  contentType: string,
  key: string,
): Promise<string> {
  const payload = new Uint8Array(payloadInput);
  const config = getConfig();
  const payloadHash = await sha256(payload);
  const { amzDate, date } = amzDateParts(new Date());
  const endpoint = new URL(config.endpoint);
  const path = `/${config.bucket}/${encodedKey(key)}`;
  const host = endpoint.host;
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256(encoder.encode(canonicalRequest)),
  ].join("\n");
  const signature = Buffer.from(await hmac(await signingKey(config.secretAccessKey, date, config.region), stringToSign)).toString("hex");

  const response = await fetch(`${config.endpoint}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`Nahratie fotografie zlyhalo (${response.status}).`);
  }

  return `${config.publicUrl}/${encodedKey(key)}`;
}
