import React, { useEffect, useState } from "react";
import LoginGate from "./components/LoginGate";
import ClientApp, { ClientState } from "./dashboards/ClientApp";
import GymAdmin from "./dashboards/GymAdmin";
import SuperAdmin from "./dashboards/SuperAdmin";
import Trainer from "./dashboards/Trainer";
import { GYMS, Role } from "./data";
import { AppProvider, useApp } from "./store";
import { Icon, IconName } from "./components/ui";

/* ---------- tiny inline glyphs (not part of the icon set) ---------- */
const SunIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
  </svg>
);
const MoonIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
);
const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5Z" />
  </svg>
);

/* ---------- toggles shared by header & login ---------- */
export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, toast, t } = useApp();
  return (
    <div className="flex items-center chip rounded-full p-1 gap-0.5" role="group" aria-label="language">
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => { if (lang !== l) { setLang(l); toast(t("toast.lang"), "mint"); } }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${lang === l ? "bg-[var(--brand)] text-[#0b110d] shadow-[0_4px_14px_-4px_var(--brand-line)]" : "text-moss hover:text-snow"}`}
        >
          {l === "ar" ? "عربي" : "EN"}
        </button>
      ))}
      {!compact && <span className="px-1.5 text-moss2 hidden sm:grid place-items-center"><GlobeIcon className="w-3.5 h-3.5" /></span>}
    </div>
  );
}

export function ModeToggle() {
  const { mode, setMode, toast, t } = useApp();
  return (
    <button
      onClick={() => { const m = mode === "dark" ? "light" : "dark"; setMode(m); toast(t("toast.mode"), m === "dark" ? "sky" : "ember"); }}
      className="chip rounded-full w-9 h-9 grid place-items-center text-moss hover:text-[var(--brand)] hover:border-[var(--brand-line)] transition-all duration-300 hover:rotate-12"
      aria-label="toggle theme"
      title={mode === "dark" ? t("mode.light") : t("mode.dark")}
    >
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/* ---------- toasts ---------- */
function Toasts() {
  const { toasts } = useApp();
  const toneStyle: Record<string, string> = {
    brand: "border-[var(--brand-line)] text-[var(--brand)]",
    mint: "border-mint/40 text-mint",
    ember: "border-ember/40 text-ember",
    blush: "border-blush/40 text-blush",
    sky: "border-sky2/40 text-sky2",
    moss: "border-line2 text-moss",
  };
  return (
    <div className="fixed bottom-5 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((x) => (
        <div key={x.id} className={`anim-toast glass-deep rounded-full border px-5 py-2.5 flex items-center gap-2.5 text-xs font-bold text-snow shadow-2xl ${toneStyle[x.tone] ?? toneStyle.brand}`}>
          <span className={`w-2 h-2 rounded-full ${x.tone === "mint" ? "bg-mint" : x.tone === "ember" ? "bg-ember" : x.tone === "blush" ? "bg-blush" : x.tone === "sky" ? "bg-sky2" : "bg-[var(--brand)]"}`} />
          {x.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- gym switcher ---------- */
function GymSwitcher() {
  const { gymId, setGym, toast, t, loc } = useApp();
  const [open, setOpen] = useState(false);
  const g = GYMS.find((x) => x.id === gymId)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost rounded-full flex items-center gap-2.5 py-1.5 ps-2 pe-3.5">
        <span className="w-6 h-6 rounded-lg grid place-items-center font-display font-bold text-[11px] overflow-hidden" style={{ background: g.accent, color: "#0b110d" }}>
          {g.initial}
        </span>
        <span className="text-xs font-bold text-snow hidden md:block">{loc(g)}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`w-3.5 h-3.5 text-moss transition-transform duration-300 ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute z-40 top-12 start-0 w-64 glass-deep rounded-2xl p-1.5 anim-fade-up" style={{ animationDuration: "0.25s" }}>
            <div className="px-3 py-2 text-[10px] font-bold text-moss2">{t("nav.switchGym")}</div>
            {GYMS.map((x) => (
              <button
                key={x.id}
                onClick={() => { setGym(x.id); setOpen(false); toast(`${t("toast.gymSwitch")} — ${loc(x)}`, "brand"); }}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors ${x.id === gymId ? "bg-[var(--brand-soft)]" : "hover:bg-white/5"}`}
              >
                <span className="w-7 h-7 rounded-lg grid place-items-center font-display font-bold text-xs overflow-hidden" style={{ background: x.accent, color: "#0b110d" }}>{x.initial}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-snow truncate">{loc(x)}</span>
                  <span className="block text-[9px] text-moss2">{x.city}</span>
                </span>
                {x.id === gymId && <Icon name="check" className="w-4 h-4 text-[var(--brand)]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- shell ---------- */
const NAV: Record<Role, { id: string; icon: IconName; key: string }[]> = {
  super: [
    { id: "overview", icon: "chart", key: "nav.overview" },
    { id: "gyms", icon: "grid", key: "nav.gyms" },
    { id: "system", icon: "shield", key: "nav.system" },
    { id: "settings", icon: "settings", key: "nav.settings" },
  ],
  gymAdmin: [
    { id: "overview", icon: "chart", key: "nav.overview" },
    { id: "trainers", icon: "users", key: "nav.trainers" },
    { id: "members", icon: "userPlus", key: "nav.members" },
    { id: "branding", icon: "palette", key: "nav.branding" },
    { id: "devices", icon: "bolt", key: "nav.devices" },
    { id: "settings", icon: "settings", key: "nav.settings" },
  ],
  trainer: [
    { id: "clients", icon: "users", key: "nav.clients" },
    { id: "builder", icon: "dumbbell", key: "nav.builder" },
    { id: "nutrition", icon: "apple", key: "nav.nutrition" },
    { id: "progress", icon: "target", key: "nav.progress" },
  ],
  client: [
    { id: "home", icon: "home", key: "nav.home" },
    { id: "workouts", icon: "dumbbell", key: "nav.workouts" },
    { id: "nutrition", icon: "apple", key: "nav.nutrition" },
    { id: "devices", icon: "heart", key: "nav.devices" },
    { id: "progress", icon: "target", key: "nav.progress" },
    { id: "checkin", icon: "calendar", key: "nav.checkin" },
  ],
};

const ROLE_KEY: Record<Role, string> = { super: "role.super", gymAdmin: "role.gymAdmin", trainer: "role.trainer", client: "role.client" };
const ROLE_USER: Record<Role, string> = { super: "role.superUser", gymAdmin: "role.gymAdminUser", trainer: "role.trainerUser", client: "role.clientUser" };

function Ambient() {
  const { brand } = useApp();
  return (
    <>
      {brand.bgUrl && <div className="bgphoto-layer" style={{ backgroundImage: `url(${brand.bgUrl})` }} />}
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="grid-layer" />
      <div className="noise-layer" />
    </>
  );
}

function Shell() {
  const { role, logout, brand, lang, t, loc } = useApp();
  const [tab, setTab] = useState("overview");
  const [clientState, setClientState] = useState<ClientState>({
    done: [0, 1, 2], loggedMeals: [0, 1], water: 4,
    device: null, pairing: null, bpm: 0, steps: 8420, scaleLog: [],
  });

  useEffect(() => { setTab(NAV[role!][0].id); }, [role]);
  if (!role) return null;

  const nav = NAV[role];
  const isAdmin = role === "gymAdmin" || role === "super";
  const current = nav.find((n) => n.id === tab) ?? nav[0];

  return (
    <div className="min-h-screen relative z-10 flex">
      {/* ======= sidebar ======= */}
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 sticky top-0 h-screen glass-deep border-e border-[var(--glass-border)] z-20">
        {brand.bannerUrl && (
          <div className="h-20 w-full relative overflow-hidden border-b border-[var(--glass-border)]">
            <img src={brand.bannerUrl} alt="banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--color-panel) 92%, transparent), transparent 70%)" }} />
          </div>
        )}
        <div className={`flex items-center gap-3 ${brand.bannerUrl ? "px-5 -mt-7 relative" : "px-5 pt-6"}`}>
          <span className="w-11 h-11 rounded-2xl grid place-items-center font-display font-extrabold text-lg shrink-0 shadow-[0_10px_26px_-8px_var(--brand-line)] overflow-hidden" style={{ background: brand.accent, color: "#0b110d" }}>
            {brand.logoUrl ? <img src={brand.logoUrl} alt="logo" className="w-full h-full object-cover" /> : brand.initial}
          </span>
          <div className="min-w-0">
            <div className="font-display font-extrabold text-[15px] leading-5 text-snow truncate">{lang === "en" ? brand.nameEn : brand.nameAr}</div>
            <div className="text-[10px] text-moss truncate">{t(ROLE_KEY[role] as never)}</div>
          </div>
        </div>
        <div className="mark-line mx-5 mt-4 mb-2 w-16" />

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`nav-item w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-moss ${tab === n.id ? "nav-active" : ""}`}
            >
              <Icon name={n.icon} className="w-[18px] h-[18px]" />
              {t(n.key as never)}
              {tab === n.id && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-[var(--brand)] live-dot" />}
            </button>
          ))}
        </nav>

        <div className="p-4">
          <div className="glass rounded-2xl p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl grid place-items-center text-[var(--brand)] bg-[var(--brand-soft)] border border-[var(--brand-line)]">
                <Icon name="users" className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-snow truncate">{t(ROLE_USER[role] as never)}</div>
                <div className="text-[9px] text-moss2 truncate">{isAdmin ? "Admin · Full access" : `${loc({ nameAr: brand.nameAr, nameEn: brand.nameEn })}`}</div>
              </div>
            </div>
            <button onClick={logout} className="mt-3 w-full btn-ghost rounded-xl py-2 text-[11px] font-bold text-moss flex items-center justify-center gap-2 hover:text-blush hover:!border-blush/40">
              <Icon name="logout" className="w-4 h-4" /> {t("nav.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* ======= main ======= */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass-deep border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3 px-4 lg:px-7 h-[62px]">
            {/* mobile mark */}
            <span className="lg:hidden w-9 h-9 rounded-xl grid place-items-center font-display font-bold overflow-hidden" style={{ background: brand.accent, color: "#0b110d" }}>
              {brand.logoUrl ? <img src={brand.logoUrl} alt="logo" className="w-full h-full object-cover" /> : brand.initial}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] text-moss2 leading-3">{lang === "en" ? brand.nameEn : brand.nameAr}</div>
              <h1 className="font-display font-bold text-[17px] leading-6 text-snow truncate">{t(current.key as never)}</h1>
            </div>
            <div className="ms-auto flex items-center gap-2.5">
              <GymSwitcher />
              <LangToggle />
              <ModeToggle />
              <button onClick={logout} className="lg:hidden chip rounded-full w-9 h-9 grid place-items-center text-moss hover:text-blush transition-colors" aria-label="logout">
                <Icon name="logout" className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* mobile nav */}
          <div className="lg:hidden flex gap-1.5 px-4 pb-3 overflow-x-auto">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${tab === n.id ? "tab-active" : "border-[var(--glass-border)] text-moss"}`}>
                <Icon name={n.icon} className="w-3.5 h-3.5" /> {t(n.key as never)}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-7 py-6 pb-16">
          <div key={`${role}-${tab}-${brand.accent}`} className="anim-fade-in">
            {role === "super" && <SuperAdmin tab={tab} />}
            {role === "gymAdmin" && <GymAdmin tab={tab} />}
            {role === "trainer" && <Trainer tab={tab} />}
            {role === "client" && <ClientApp tab={tab} state={clientState} setState={(fn) => setClientState((p) => fn(p))} />}
          </div>
        </main>

        <footer className="px-7 pb-6 text-[10px] text-moss2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] live-dot" />
          FitPro Center v2.5 · {t("app.env")}: preview.fitpro.sa · Multi-tenant White-label
        </footer>
      </div>
    </div>
  );
}

function Root() {
  const { role } = useApp();
  return (
    <>
      <Ambient />
      {role ? <Shell /> : <LoginGate />}
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
