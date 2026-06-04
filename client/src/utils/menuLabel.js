/** Es. «PHOTOGRAPHY» → «Photography», «chi sono» → «Chi sono» */
export function menuLabel(text) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
