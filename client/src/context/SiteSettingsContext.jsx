import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_SITE_CONTACT } from "../constants/contact.js";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const SiteSettingsContext = createContext({
  ...DEFAULT_SITE_CONTACT,
  loading: true,
  refresh: () => {},
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEFAULT_SITE_CONTACT });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/site-settings`);
      const data = await res.json();
      setSettings({
        publicEmail: data.publicEmail ?? DEFAULT_SITE_CONTACT.publicEmail,
        instagramUrl: data.instagramUrl ?? DEFAULT_SITE_CONTACT.instagramUrl,
      });
    } catch (e) {
      console.error("Site settings", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = {
    ...settings,
    loading,
    refresh,
  };

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
