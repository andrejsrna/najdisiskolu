import "server-only";
import sharp from "sharp";
import { uploadPublicBuffer } from "@/lib/s3";

/**
 * Kompresia obrázkov pre web — „retina, ale nič brutálne“.
 * Max šírka 2000 px (dosť pre 2x retina pri bežnej šírke obsahu ~960–1000 px),
 * JPEG kvalita 82 s mozjpeg enkóderom. EXIF orientácia sa aplikuje a odstráni,
 * aby fotky z fotoaparátu neboli natočené.
 */
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 82;

export type CompressedImage = {
  buffer: Buffer;
  contentType: string;
  extension: "jpg" | "webp";
};

/**
 * Skomprimuje obrázok (JPEG/PNG/WebP) na web-friendly veľkosť.
 * PNG so priehľadnosťou necháme ako WebP (zachová alfa kanál), ostatné → JPEG.
 */
export async function compressImage(
  input: ArrayBuffer,
  mimeType: string,
): Promise<CompressedImage> {
  const image = sharp(Buffer.from(input)).rotate(); // aplikuje EXIF orientáciu, potom ju odstráni
  const metadata = await image.metadata();
  const hasAlpha = Boolean(metadata.hasAlpha) && mimeType === "image/png";

  const resized = image.resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (hasAlpha) {
    const buffer = await resized.webp({ quality: WEBP_QUALITY }).toBuffer();
    return { buffer, contentType: "image/webp", extension: "webp" };
  }

  const buffer = await resized
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  return { buffer, contentType: "image/jpeg", extension: "jpg" };
}

/**
 * Skomprimuje a nahrá obrázok na S3 v jednom kroku.
 * `keyBase` je kľúč BEZ prípony — prípona sa doplní podľa výsledného formátu (jpg/webp).
 */
export async function compressAndUploadImage(
  file: File,
  keyBase: string,
): Promise<string> {
  const input = await file.arrayBuffer();
  const compressed = await compressImage(input, file.type);
  const key = `${keyBase}.${compressed.extension}`;
  return uploadPublicBuffer(compressed.buffer, compressed.contentType, key);
}
