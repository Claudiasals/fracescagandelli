/**
 * Base URL API backend (senza slash finale).
 * Dev: `/api` → proxy Vite verso localhost:5000 (funziona anche da smartphone sulla LAN).
 * Produzione: imposta VITE_API_URL su Netlify, es. https://francescagandelli.onrender.com/api
 */
const raw =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "/api" : "http://localhost:5000/api");
export const API_BASE = raw.replace(/\/+$/, "");
