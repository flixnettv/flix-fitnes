import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GYMS, Gym, Role } from "./data";
import { apiLogin, clearSession, restoreSession, postLoginSync, fetchBranding, ROLE_MAP, type AuthUser } from "./lib/api";
import { DICT, Lang, TKey, detectBrowserLang } from "./i18n";

export type Mode = "dark" | "light";

export interface GymFeatures {
  water: boolean;
  scanner: boolean;
  photos: boolean;
  payments: boolean;
}

export interface Branding {
  nameAr: string;
  nameEn: string;
  initial: string;
  accent: string;
  accent2: string;
  logoUrl: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  bgUrl: string | null;
  radius: number;
  fontDisplay: string;
  fontBody: string;
  defaultLang: Lang;
  domain: string;
  welcome: string;
  memberMode: "dark" | "light";
  features: GymFeatures;
}

export interface Toast { id: number; msg: string; tone: string }

const ACCENT2: Record<string, string> = {
  g1: "#ffc65c", g2: "#45d6c0", g3: "#f4727f", g4: "#7fb4ff", g5: "#c084fc",
};

const brandFromGym = (g: Gym, lang: Lang): Branding => ({
  nameAr: g.nameAr,
  nameEn: g.nameEn,
  initial: g.initial,
  accent: g.accent,
  accent2: ACCENT2[g.id] ?? "#45d6c0",
  logoUrl: null,
  bannerUrl: null,
  bgUrl: null,
  radius: 16,
  fontDisplay: lang === "ar" ? "Changa" : "Space Grotesk",
  fontBody: lang === "ar" ? "Tajawal" : "IBM Plex Sans Arabic",
  defaultLang: lang,
  domain: `${g.nameEn.toLowerCase().replace(/[^a-z]+/g, "")}.fitpro.app`,
  iconUrl: null,
  welcome: "",
  memberMode: "dark",
  features: { water: true, scanner: true, photos: true, payments: true },
});

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

interface AppCtx {
  role: Role | null;
  login: (r: Role) => void;
  logout: () => void;
  user: AuthUser | null;
  authBusy: boolean;
  authError: string | null;
  realLogin: (email: string, password: string) => Promise<boolean>;
  gymId: string;
  gym: Gym;
  setGym: (id: string) => void;
  brand: Branding;
  setBrand: (patch: Partial<Branding>) => void;
  resetBrand: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  firstVisit: boolean;
  dismissFirstVisit: () => void;
  t: (k: TKey) => string;
  loc: (o: { nameAr: string; nameEn: string }) => string;
  toast: (msg: string, tone?: string) => void;
  toasts: Toast[];
}

const Ctx = createContext<AppCtx | null>(null);

const LS = { lang: "fitpro_lang", mode: "fitpro_mode", visited: "fitpro_visited" };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem(LS.lang) as Lang) || detectBrowserLang(); } catch { return detectBrowserLang(); }
  });
  const [mode, setModeState] = useState<Mode>(() => {
    try { return (localStorage.getItem(LS.mode) as Mode) || "dark"; } catch { return "dark"; }
  });
  const [firstVisit, setFirstVisit] = useState<boolean>(() => {
    try { return !localStorage.getItem(LS.visited); } catch { return true; }
  });

  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [gymId, setGymId] = useState(GYMS[0].id);
  const gym = useMemo(() => GYMS.find((g) => g.id === gymId) ?? GYMS[0], [gymId]);
  const [brand, setBrandState] = useState<Branding>(() => brandFromGym(GYMS[0], lang));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  /* ---------- side effects ---------- */
  useEffect(() => {
    const el = document.documentElement;
    el.dir = lang === "ar" ? "rtl" : "ltr";
    el.lang = lang;
    try { localStorage.setItem(LS.lang, lang); } catch { /* noop */ }
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    try { localStorage.setItem(LS.mode, mode); } catch { /* noop */ }
  }, [mode]);

  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty("--brand", brand.accent);
    s.setProperty("--brand-soft", hexToRgba(brand.accent, 0.13));
    s.setProperty("--brand-line", hexToRgba(brand.accent, 0.42));
    s.setProperty("--brand-glow", hexToRgba(brand.accent, mode === "dark" ? 0.11 : 0.16));
    s.setProperty("--radius", String(brand.radius));
    s.setProperty("--font-display", `"${brand.fontDisplay}", "Tajawal", sans-serif`);
    s.setProperty("--font-body", `"${brand.fontBody}", "Tajawal", sans-serif`);
  }, [brand, mode]);

  /* live favicon follows the gym's icon/logo */
  useEffect(() => {
    const url = brand.iconUrl || brand.logoUrl;
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [brand.iconUrl, brand.logoUrl]);

  /* ---------- actions ---------- */
  const toast = useCallback((msg: string, tone = "brand") => {
    const id = idRef.current++;
    setToasts((ts) => [...ts.slice(-3), { id, msg, tone }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3400);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState((prev) => {
      if (l !== prev) {
        setBrandState((b) => ({
          ...b,
          fontDisplay: (b.fontDisplay === "Changa" || b.fontDisplay === "Space Grotesk") ? (l === "ar" ? "Changa" : "Space Grotesk") : b.fontDisplay,
          fontBody: (b.fontBody === "Tajawal" || b.fontBody === "IBM Plex Sans Arabic") ? (l === "ar" ? "Tajawal" : "IBM Plex Sans Arabic") : b.fontBody,
          defaultLang: l,
        }));
      }
      return l;
    });
    try { localStorage.setItem(LS.visited, "1"); } catch { /* noop */ }
    setFirstVisit(false);
  }, []);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const dismissFirstVisit = useCallback(() => {
    setFirstVisit(false);
    try { localStorage.setItem(LS.visited, "1"); } catch { /* noop */ }
  }, []);

  const login = useCallback((r: Role) => {
    // demo/preview entry — keeps the design explorable without credentials
    setUser(null);
    setRole(r);
    dismissFirstVisit();
  }, [dismissFirstVisit]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setRole(null);
  }, []);

  const applyBrandingFromApi = useCallback(async () => {
    try {
      const b = await fetchBranding();
      setBrandState((prev) => ({
        ...prev,
        nameAr: b.name,
        nameEn: b.name,
        initial: (b.name || "F").trim().charAt(0),
        accent: b.primary_color || prev.accent,
        accent2: b.secondary_color || prev.accent2,
        logoUrl: b.logo ?? null,
        iconUrl: b.logo ?? null,
      }));
    } catch { /* keep current branding */ }
  }, []);

  const activateUser = useCallback(async (u: AuthUser) => {
    setUser(u);
    // data must be fully synced BEFORE the dashboards render
    await postLoginSync();
    await applyBrandingFromApi();
    // Unknown backend role must never silently drop a superuser into the client view.
    setRole(ROLE_MAP[u.role] ?? (u.isSuperuser ? "super" : "client"));
    dismissFirstVisit();
  }, [applyBrandingFromApi, dismissFirstVisit]);

  const realLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const u = await apiLogin(email, password);
      await activateUser(u);
      return true;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "فشل تسجيل الدخول");
      return false;
    } finally {
      setAuthBusy(false);
    }
  }, [activateUser]);

  /* brand the LOGIN screen from the subdomain's gym (before any auth) */
  useEffect(() => {
    (async () => {
      try {
        const b = await fetchBranding();
        setBrandState((prev) => ({
          ...prev,
          nameAr: b.name,
          nameEn: b.name,
          initial: (b.name || "F").trim().charAt(0),
          accent: b.primary_color || prev.accent,
          accent2: b.secondary_color || prev.accent2,
          logoUrl: b.logo ?? null,
          iconUrl: b.logo ?? null,
          bannerUrl: b.banner ?? null,
          welcome: b.splash_title || "",
        }));
      } catch { /* keep defaults */ }
    })();
  }, []);

  /* restore session on mount */
  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await restoreSession();
      if (alive && u) {
        try {
          await activateUser(u);
        } catch { /* noop */ }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setGym = useCallback((id: string) => {
    setGymId(id);
    const g = GYMS.find((x) => x.id === id);
    if (g) setBrandState(brandFromGym(g, lang));
  }, [lang]);

  const setBrand = useCallback((patch: Partial<Branding>) => {
    setBrandState((b) => ({ ...b, ...patch }));
  }, []);

  const resetBrand = useCallback(() => {
    setBrandState(brandFromGym(gym, lang));
  }, [gym, lang]);

  const t = useCallback((k: TKey) => DICT[lang][k] ?? DICT.ar[k] ?? k, [lang]);
  const loc = useCallback((o: { nameAr: string; nameEn: string }) => (lang === "en" ? o.nameEn : o.nameAr), [lang]);

  const value: AppCtx = {
    role, login, logout, user, authBusy, authError, realLogin,
    gymId, gym, setGym,
    brand, setBrand, resetBrand,
    lang, setLang, mode, setMode,
    firstVisit, dismissFirstVisit,
    t, loc, toast, toasts,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}
