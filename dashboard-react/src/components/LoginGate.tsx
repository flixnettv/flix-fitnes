import { useState } from "react";
import { LangToggle, ModeToggle } from "../App";
import { GYMS, Role } from "../data";
import { useApp } from "../store";
import { Icon, IconName, Ring, Sparkline, useCountUp } from "./ui";

const ROLES: { role: Role; icon: IconName; key: string; descKey: string; userKey: string }[] = [
  { role: "super", icon: "shield", key: "role.super", descKey: "role.superDesc", userKey: "role.superUser" },
  { role: "gymAdmin", icon: "grid", key: "role.gymAdmin", descKey: "role.gymAdminDesc", userKey: "role.gymAdminUser" },
  { role: "trainer", icon: "dumbbell", key: "role.trainer", descKey: "role.trainerDesc", userKey: "role.trainerUser" },
  { role: "client", icon: "heart", key: "role.client", descKey: "role.clientDesc", userKey: "role.clientUser" },
];

function PhonePreview() {
  const { brand, t, lang } = useApp();
  return (
    <div className="w-[250px] rounded-[28px] glass-deep p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] anim-float">
      <div className="rounded-[20px] overflow-hidden border border-[var(--glass-border)] bg-[var(--color-bg)]">
        {/* banner / status */}
        <div className="relative h-14 overflow-hidden">
          {brand.bannerUrl ? (
            <img src={brand.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(120deg, color-mix(in srgb, ${brand.accent} 45%, transparent), color-mix(in srgb, ${brand.accent2} 30%, transparent))` }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--color-bg), transparent 80%)" }} />
          <span className="absolute top-2 inset-x-4 flex justify-between text-[9px] text-snow/80">
            <span>9:41</span><span className="w-4 h-2 rounded-sm border border-snow/60" />
          </span>
        </div>
        {/* app header */}
        <div className="px-3.5 -mt-5 relative flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl grid place-items-center font-display font-bold text-sm shadow-lg overflow-hidden shrink-0" style={{ background: brand.accent, color: "#0b110d" }}>
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="w-full h-full object-cover" /> : brand.initial}
          </span>
          <div className="min-w-0">
            <div className="font-display font-bold text-[13px] leading-4 text-snow truncate">{lang === "en" ? brand.nameEn : brand.nameAr}</div>
            <div className="text-[9px] text-moss truncate">{t("login.previewHi")} 💪</div>
          </div>
          <span className="ms-auto w-2 h-2 rounded-full live-dot shrink-0" style={{ background: brand.accent }} />
        </div>
        {/* today workout */}
        <div className="mx-3 mt-3 rounded-2xl p-2.5 border relative overflow-hidden" style={{ background: `color-mix(in srgb, ${brand.accent} 12%, transparent)`, borderColor: `color-mix(in srgb, ${brand.accent} 35%, transparent)` }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold" style={{ color: brand.accent }}>{t("login.todayWorkout")}</span>
            <span className="text-[9px] text-moss">{t("login.exercises5")}</span>
          </div>
          <div className="font-display font-bold text-snow text-[13px] mt-0.5">{t("login.pushDay")}</div>
          <div className="h-1.5 rounded-full bg-black/25 mt-2 overflow-hidden">
            <div className="h-full rounded-full w-[62%]" style={{ background: `linear-gradient(90deg, ${brand.accent2}, ${brand.accent})` }} />
          </div>
          <div className="text-[9px] text-moss mt-1">{t("login.done3")}</div>
        </div>
        {/* macros */}
        <div className="flex justify-around py-3 px-2">
          <Ring pct={72} size={56} thickness={5.5} label="72%" subLabel={t("login.protein")} color={brand.accent} />
          <Ring pct={58} size={56} thickness={5.5} label="58%" subLabel={t("login.carbs")} color="#FF8A3C" />
          <Ring pct={44} size={56} thickness={5.5} label="44%" subLabel={t("login.fat")} color="#45D6C0" />
        </div>
        {/* nav */}
        <div className="flex justify-around border-t border-[var(--glass-border)] py-2 text-moss">
          {(["home", "dumbbell", "apple", "heart", "chart"] as IconName[]).map((n, i) => (
            <Icon key={n} name={n} className={`w-4 h-4 ${i === 0 ? "" : "opacity-45"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Ticker() {
  const { t } = useApp();
  const items: [string, string][] = [
    [t("kpi.members"), "3,842"], [t("kpi.sessionsWeek"), "1,216"], ["Workout plans", "894"],
    ["Nutrition plans", "612"], [t("kpi.gyms"), "5"], ["Rating", "4.8 ★"], [t("kpi.devicesOnline"), "212"],
  ];
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-t border-[var(--glass-border)] glass-deep">
      <div className="ticker-track flex w-max items-center gap-10 py-2.5 px-6">
        {doubled.map(([k, v], i) => (
          <span key={i} className="flex items-center gap-2 text-[11px] text-moss whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: i % 2 ? "var(--brand)" : "#FF8A3C" }} />
            {k} <b className="font-display text-snow text-xs">{v}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LoginGate() {
  const { login, setGym, gymId, toast, brand, lang, setLang, firstVisit: fv, t, loc } = useApp();
  const [picked, setPicked] = useState<Role | null>(null);
  const gymsCount = useCountUp(GYMS.length, 700);
  const members = useCountUp(2683, 1300);

  const enter = (role: Role) => {
    setPicked(role);
    window.setTimeout(() => { login(role); toast(t("toast.welcome"), "mint"); }, 420);
  };

  return (
    <div className="min-h-screen relative z-10 flex flex-col">
      {/* top bar */}
      <div className="flex items-center gap-3 px-6 lg:px-12 h-16 border-b border-[var(--glass-border)] glass-deep sticky top-0 z-30">
        <span className="w-9 h-9 rounded-xl grid place-items-center overflow-hidden" style={{ background: "var(--brand)" }}>
          <Icon name="dumbbell" className="w-5 h-5 text-[#0b110d]" />
        </span>
        <div className="leading-4">
          <div className="font-display font-extrabold text-[15px] text-snow">FitPro Center</div>
          <div className="text-[9px] text-moss">{t("app.tagline")}</div>
        </div>
        <div className="ms-auto flex items-center gap-2.5">
          <LangToggle />
          <ModeToggle />
        </div>
      </div>

      {/* first-visit language ribbon */}
      {fv && (
        <div className="relative z-20 mx-4 lg:mx-12 -mb-2 mt-4">
          <div className="glass sheen rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-3 border-[var(--brand-line)]">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-5 h-5"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5Z" /></svg>
            </span>
            <p className="text-xs text-snow flex-1 min-w-[220px]">
              <b className="font-display">{t("login.firstVisit")}</b>{" "}
              <span className="text-moss">{lang === "ar" ? "العربية" : "English"} — {t("login.switchTo")} {lang === "ar" ? "English؟" : "العربية؟"}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setLang("ar"); toast(t("toast.lang"), "mint"); }} className={`rounded-xl px-4 py-2 text-[11px] font-bold transition-all ${lang === "ar" ? "btn-brand" : "btn-ghost text-moss"}`}>العربية</button>
              <button onClick={() => { setLang("en"); toast(t("toast.lang"), "mint"); }} className={`rounded-xl px-4 py-2 text-[11px] font-bold transition-all ${lang === "en" ? "btn-brand" : "btn-ghost text-moss"}`}>English</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid lg:grid-cols-[1.05fr_1fr]">
        {/* ====== brand side ====== */}
        <div className="relative flex flex-col justify-center gap-9 px-6 lg:px-14 py-10 border-e border-[var(--glass-border)]">
          <div className="anim-fade-up">
            <h1 className="font-display font-extrabold text-[40px] lg:text-[54px] leading-[1.08] tracking-tight text-snow">
              {t("login.h1a")}
              <br />
              <span className="relative inline-block" style={{ color: "var(--brand)" }}>
                {t("login.h1b")}
                <span className="absolute -bottom-2 inset-x-0 mark-line" />
              </span>
            </h1>
            <p className="text-moss text-sm leading-7 mt-6 max-w-md">{t("login.desc")}</p>
          </div>

          {/* tenant switcher */}
          <div className="anim-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="text-[11px] text-moss mb-2.5 flex items-center gap-2">
              <Icon name="palette" className="w-3.5 h-3.5" /> {t("login.tenant")} — <span className="text-moss2">{t("login.tenantSub")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GYMS.map((g) => {
                const on = g.id === gymId;
                return (
                  <button
                    key={g.id}
                    onClick={() => { setGym(g.id); toast(`${t("toast.gymSwitch")} — ${loc(g)}`, "brand"); }}
                    className={`sheen flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-300 ${on ? "glass border-[var(--brand-line)] text-snow -translate-y-0.5 shadow-[0_12px_30px_-12px_var(--brand-line)]" : "chip text-moss hover:text-snow"}`}
                  >
                    <span className="w-5 h-5 rounded-md grid place-items-center font-display text-[10px] overflow-hidden" style={{ background: g.accent, color: "#0b110d" }}>{g.initial}</span>
                    {loc(g)}
                    {on && <Icon name="check" className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* live stats */}
          <div className="flex items-center gap-7 anim-fade-up flex-wrap" style={{ animationDelay: "220ms" }}>
            <div>
              <div className="font-display font-extrabold text-3xl text-snow">{gymsCount}</div>
              <div className="text-[11px] text-moss">{t("login.gymsOn")}</div>
            </div>
            <div className="w-px h-10 bg-[var(--glass-border)]" />
            <div>
              <div className="font-display font-extrabold text-3xl text-snow">{members.toLocaleString()}</div>
              <div className="text-[11px] text-moss">{t("login.membersOn")}</div>
            </div>
            <div className="w-px h-10 bg-[var(--glass-border)] hidden sm:block" />
            <div className="hidden sm:block">
              <Sparkline data={[12, 15, 14, 18, 21, 20, 26, 29]} w={110} h={34} />
              <div className="text-[11px] text-moss">{t("login.growthLine")}</div>
            </div>
          </div>
        </div>

        {/* ====== portals side ====== */}
        <div className="flex flex-col justify-center items-center gap-8 px-6 lg:px-12 py-10">
          <PhonePreview />
          <div className="w-full max-w-md">
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[11px] text-moss mb-2.5">
                <span className="w-2 h-2 rounded-full live-dot" style={{ background: "var(--brand)" }} />
                {t("app.env")}: <b className="text-snow" dir="ltr">preview.fitpro.sa</b> · {t("app.version")} 2.5.0
              </div>
              <h2 className="font-display font-bold text-2xl text-snow">{t("login.choosePortal")}</h2>
              <p className="text-xs text-moss mt-1.5">{t("login.sub")}</p>
            </div>

            <div className="flex flex-col gap-3">
              {ROLES.map((r, i) => {
                const active = picked === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => enter(r.role)}
                    disabled={picked !== null}
                    className={`anim-fade-up sheen group text-start glass panel-hover p-4 flex items-center gap-4 ${active ? "!border-[var(--brand-line)]" : ""}`}
                    style={{ animationDelay: `${140 + i * 90}ms` }}
                  >
                    <span
                      className="w-12 h-12 rounded-2xl grid place-items-center border shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                      style={{ background: "var(--brand-soft)", borderColor: "var(--brand-line)", color: "var(--brand)" }}
                    >
                      <Icon name={r.icon} className="w-6 h-6" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-display font-bold text-snow text-[15px]">{t(r.key as never)}</span>
                        {r.role === "trainer" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-ember/15 text-ember border border-ember/30">{t("login.mostUsed")}</span>}
                      </span>
                      <span className="block text-[11px] text-moss mt-0.5 truncate">{t(r.descKey as never)}</span>
                      <span className="block text-[10px] text-moss2 mt-1">{t("login.as")}: {t(r.userKey as never)} · {loc({ nameAr: brand.nameAr, nameEn: brand.nameEn })}</span>
                    </span>
                    <span className={`grid place-items-center w-9 h-9 rounded-full border transition-all duration-300 ${active ? "bg-[var(--brand)] border-transparent text-[#0b110d]" : "border-[var(--glass-border)] text-moss group-hover:border-[var(--brand-line)] group-hover:text-[var(--brand)] group-hover:-translate-x-1"}`}>
                      <Icon name="arrow" className="w-4 h-4" />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-moss2 mt-6 leading-5">{t("login.note")}</p>
          </div>
        </div>
      </div>

      <Ticker />
    </div>
  );
}
