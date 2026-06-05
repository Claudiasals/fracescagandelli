/** Paragrafo introduttivo sotto le foto — galleria «Custode di piccoli mondi». */
export const STORYTELLING_GALLERY_INTRO = "Dove l'artigiano incontra la natura";

export const GALLERY_INTRO_BY_SLUG = {
  storytelling: STORYTELLING_GALLERY_INTRO,
};

/** Valori seed obsoleti da sostituire se ancora in DB. */
export const LEGACY_GALLERY_INTROS = {
  storytelling: "Racconti fotografici",
};

export function resolveGalleryIntro(slug, stored) {
  const trimmed = typeof stored === "string" ? stored.trim() : "";
  const fallback = GALLERY_INTRO_BY_SLUG[slug];
  const legacy = LEGACY_GALLERY_INTROS[slug];
  if (fallback && (!trimmed || trimmed === legacy)) return fallback;
  return trimmed;
}
