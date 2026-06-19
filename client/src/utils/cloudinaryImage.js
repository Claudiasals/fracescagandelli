const UPLOAD_SEGMENT = "/image/upload/";

/** Larghezze delivery Cloudinary (px) per contesto di visualizzazione. */
export const CLOUDINARY_WIDTH = {
  card: 800,
  gallery: 1200,
  lightbox: 2000,
  portrait: 1200,
};

/**
 * Restituisce un URL Cloudinary ottimizzato per il web (formato/qualità automatici, larghezza massima).
 * URL locali, blob e non-Cloudinary restano invariati.
 */
export function optimizeCloudinaryUrl(url, { width = 1200, quality = "auto" } = {}) {
  if (!url || typeof url !== "string") return url;

  const trimmed = url.trim();
  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  if (!trimmed.includes("res.cloudinary.com")) return trimmed;
  if (trimmed.includes("f_auto,q_auto")) return trimmed;

  const markerIndex = trimmed.indexOf(UPLOAD_SEGMENT);
  if (markerIndex === -1) return trimmed;

  const prefix = trimmed.slice(0, markerIndex + UPLOAD_SEGMENT.length);
  const suffix = trimmed.slice(markerIndex + UPLOAD_SEGMENT.length);
  const transforms = `f_auto,q_${quality},w_${width},c_limit`;

  return `${prefix}${transforms}/${suffix}`;
}
