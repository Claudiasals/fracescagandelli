/** Un paragrafo continuo: niente a capo o spazi multipli. */
export function normalizeInlineText(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

/** Mantiene gli a capo; su ogni riga collassa solo gli spazi multipli. */
export function normalizePreLineText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .trim();
}

/** Blocchi separati da riga vuota; dentro ogni blocco gli spazi/a capo diventano uno spazio. */
export function splitParagraphs(body) {
  if (!body || typeof body !== "string") return [];
  return body
    .split(/\n\s*\n/)
    .map((p) => normalizeInlineText(p))
    .filter(Boolean);
}
