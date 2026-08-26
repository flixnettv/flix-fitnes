import React, { useRef, useState } from "react";
import { CLIENTS, GOAL_MIX, MEMBERSHIP_LABEL, SESSIONS_WEEK, TRAINERS, WEIGHT_SERIES, fmt, money } from "../data";
import { BODY_FONTS, DISPLAY_FONTS, Lang } from "../i18n";
import { useApp } from "../store";
import { LangToggle } from "../components/LangToggle";
import { Avatar, Badge, Bars, Donut, Icon, IconName, Meter, Reveal, SectionTitle, Stars, Stepper, Switch, downloadCsv, useCountUp } from "../components/ui";

const useL = () => {
  const { lang } = useApp();
  return (o: { ar: string; en: string }) => (lang === "ar" ? o.ar : o.en);
};

/* ================= overview ================= */
function Overview() {
  const { gym, t } = useApp();
  const sessions = useCountUp(SESSIONS_WEEK.reduce((s, d) => s + d.v, 0), 1300);
  const liveMembers = CLIENTS.length || gym.members;
  const liveTrainers = TRAINERS.filter((x) => x.active).length || gym.trainersCount;
  const kpis = [
    { icon: "users" as IconName, label: t("kpi.members"), v: fmt(liveMembers), d: `${CLIENTS.length ? "مباشر ✓" : `▲ ${gym.growth}%`}`, up: true },
    { icon: "dumbbell" as IconName, label: t("kpi.trainers"), v: String(liveTrainers), d: TRAINERS.length ? "مباشر ✓" : "▲ 2", up: true },
    { icon: "bolt" as IconName, label: t("kpi.sessionsWeek"), v: fmt(sessions), d: "▲ 6.4%", up: true },
    { icon: "chart" as IconName, label: "MRR", v: money(gym.mrr), d: `▲ ${gym.growth}%`, up: true },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Reveal key={k.label} delay={i * 60}>
            <div className="glass sheen panel-hover p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-moss">{k.label}</span>
                <span className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand-line)]"><Icon name={k.icon} className="w-4 h-4" /></span>
              </div>
              <div className="font-display font-extrabold text-[24px] text-snow mt-2">{k.v}</div>
              <div className={`text-[10px] font-bold mt-1 ${k.up ? "text-mint" : "text-blush"}`}>{k.d} {t("common.vsLastWeek")}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        <Reveal delay={80}>
          <div className="glass p-5">
            <SectionTitle icon="bars" title={t("kpi.sessionsWeek")} sub={`${gym.nameAr} — ${t("common.live")}`} action={<Badge tone="brand">{t("kpi.retention")} {gym.retention}%</Badge>} />
            <Bars data={SESSIONS_WEEK} h={180} />
          </div>
        </Reveal>
        <Reveal delay={140}>
          <div className="glass p-5 h-full flex flex-col">
            <SectionTitle icon="target" title="أهداف الأعضاء" sub="توزيع حسب الهدف التدريبي" />
            <div className="flex items-center justify-center gap-6 flex-1 flex-wrap">
              <Donut center={fmt(gym.members)} sub="عضو" segments={GOAL_MIX} />
              <div className="space-y-2.5">
                {GOAL_MIX.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="text-moss">{s.label}</span>
                    <b className="font-display text-snow">{s.value}%</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <div className="glass p-5">
          <SectionTitle icon="star" title={t("gym.topTrainers")} sub="الأداء الشهري — عملاء، جلسات، وتقييم" />
          <div className="grid md:grid-cols-2 gap-3">
            {[...TRAINERS].sort((a, b) => Number(b.gymId === gym.id) - Number(a.gymId === gym.id)).slice(0, 4).map((tr) => (
              <div key={tr.id} className="chip rounded-2xl p-4 panel-hover flex items-center gap-3">
                <Avatar name={tr.name} color={tr.active ? "var(--brand)" : "#8ca392"} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-snow truncate">{tr.name}</div>
                  <div className="text-[10px] text-moss mt-0.5">{tr.clients}/{tr.maxClients} عميل · {tr.sessionsMonth} جلسة</div>
                  <div className="mt-1.5"><Meter pct={(tr.clients / tr.maxClients) * 100} /></div>
                </div>
                <div className="text-center shrink-0">
                  <Stars rating={tr.rating} />
                  <Badge tone={tr.active ? "mint" : "moss"}>{tr.active ? t("common.active") : t("common.paused")}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ================= trainers ================= */
function Trainers() {
  const { toast, t } = useApp();
  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass p-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px] text-xs text-moss">{TRAINERS.length} مدرباً (حقيقي) · متوسط التقييم <b className="text-[var(--brand)] font-display">4.8 ★</b></div>
          <button onClick={() => toast("أُرسلت دعوة مدرب جديد إلى البريد — تُفعَّل بعد قبوله", "mint")} className="btn-brand rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <Icon name="userPlus" className="w-4 h-4" /> دعوة مدرب
          </button>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-2 gap-4">
        {TRAINERS.map((tr, i) => (
          <Reveal key={tr.id} delay={i * 60}>
            <div className="glass panel-hover p-5">
              <div className="flex items-center gap-3.5">
                <Avatar name={tr.name} size="lg" color={tr.active ? "var(--brand)" : "#8ca392"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-snow">{tr.name}</span>
                    <Badge tone={tr.active ? "mint" : "moss"}>{tr.active ? t("common.active") : t("common.paused")}</Badge>
                  </div>
                  <div className="text-[10px] text-moss mt-1" dir="ltr">{tr.employeeId} · {tr.hireDate}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {tr.spec.map((s) => <span key={s} className="chip rounded-full px-2 py-0.5 text-[9px] font-bold text-moss">{s}</span>)}
                  </div>
                </div>
                <Stars rating={tr.rating} />
              </div>
              <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                {[["عملاء", `${tr.clients}/${tr.maxClients}`], ["جلسات/شهر", String(tr.sessionsMonth)], ["الأجر/ساعة", `${tr.rate} ر.س`]].map(([k, v]) => (
                  <div key={k} className="chip rounded-xl py-2">
                    <div className="text-[9px] text-moss2">{k}</div>
                    <div className="font-display font-bold text-[13px] text-snow mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {tr.certs.map((c) => <span key={c} className="text-[9px] font-bold px-2 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand-line)]" dir="ltr">{c}</span>)}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ================= members ================= */
function Members() {
  const { toast, t } = useApp();
  const [f, setF] = useState<"all" | "vip" | "premium" | "basic" | "trial">("all");
  const list = CLIENTS.filter((c) => f === "all" || c.membership === f);
  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass p-4 flex items-center gap-2.5 flex-wrap">
          {([["all", "الكل"], ["vip", "VIP"], ["premium", "بريميوم"], ["basic", "أساسية"], ["trial", "تجريبية"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all ${f === k ? "tab-active" : "border-[var(--glass-border)] text-moss hover:text-snow"}`}>{l}</button>
          ))}
          <div className="ms-auto flex gap-2">
            <button onClick={() => toast("فُتح نموذج إضافة عضو يدوي", "mint")} className="btn-brand rounded-xl px-4 py-2 text-[11px] font-bold flex items-center gap-2"><Icon name="userPlus" className="w-4 h-4" /> إضافة عضو</button>
            <button onClick={() => toast("جهّز ملف CSV — سيُستورد مع إنشاء حسابات تلقائياً", "sky")} className="btn-ghost rounded-xl px-4 py-2 text-[11px] font-bold text-moss">استيراد CSV</button>
          </div>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((c, i) => (
          <Reveal key={c.id} delay={i * 50}>
            <div className="glass panel-hover p-4">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-snow truncate">{c.name}</div>
                  <div className="text-[10px] text-moss2 mt-0.5">عضو حتى <span dir="ltr">{c.membershipEnd}</span></div>
                </div>
                <Badge tone={c.membership === "vip" ? "ember" : c.membership === "premium" ? "brand" : "moss"}>{MEMBERSHIP_LABEL[c.membership]}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-moss w-14 shrink-0">التزام {c.adherence}%</span>
                <Meter pct={c.adherence} color={c.adherence >= 85 ? "var(--brand)" : "#FF8A3C"} />
              </div>
              <div className="flex items-center justify-between mt-2.5 text-[10px] text-moss">
                <span>🎯 {c.goals.join(" · ")}</span>
                <span className="flex items-center gap-1">{c.streak > 0 && <span className="text-ember font-bold">🔥{c.streak}</span>} <span>{c.weight} كغ</span></span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ================= branding studio ================= */
const SWATCHES = ["#C6F24E", "#FF8A3C", "#45D6C0", "#F4727F", "#7FB4FF", "#C084FC", "#FFD166", "#5EEAD4"];

function UploadField({ labelKey, hintKey, field, value }: { labelKey: string; hintKey: string; field: "logoUrl" | "iconUrl" | "bannerUrl" | "bgUrl"; value: string | null }) {
  const { setBrand, toast, t } = useApp();
  const ref = useRef<HTMLInputElement>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBrand({ [field]: URL.createObjectURL(file) } as never);
    toast(t("brand.uploaded"), "mint");
    e.target.value = "";
  };
  return (
    <div className="chip rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-bold text-snow">{t(labelKey as never)}</span>
        {value && <Badge tone="mint">✓</Badge>}
      </div>
      <div className="h-20 rounded-xl border border-dashed border-[var(--glass-border)] overflow-hidden grid place-items-center mb-3 relative group">
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
              <button onClick={() => { setBrand({ [field]: null } as never); toast(t("brand.removed"), "ember"); }} className="text-[10px] font-bold text-snow bg-blush/80 rounded-lg px-3 py-1.5">{t("brand.remove")}</button>
            </div>
          </>
        ) : (
          <span className="text-[10px] text-moss2">1200×400 · PNG/JPG</span>
        )}
      </div>
      <button onClick={() => ref.current?.click()} className="btn-ghost w-full rounded-xl py-2 text-[11px] font-bold text-moss flex items-center justify-center gap-2 hover:text-snow">
        <Icon name="camera" className="w-4 h-4" /> {t("brand.upload")}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <p className="text-[9px] text-moss2 mt-2 leading-4">{t(hintKey as never)}</p>
    </div>
  );
}

function BrandingStudio() {
  const { brand, setBrand, resetBrand, toast, t, lang } = useApp();
  const [checking, setChecking] = useState(false);
  const checkDomain = () => {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      const d = brand.domain.trim().toLowerCase();
      if (d.startsWith("fitpro") || d.startsWith("www.")) toast(lang === "ar" ? "النطاق محجوز — جرّب اسماً آخر" : "Domain taken — try another name", "blush");
      else toast(lang === "ar" ? `النطاق ${d} متاح ✓ — سيُربط DNS عند النشر` : `${d} is available ✓ — DNS binds on publish`, "mint");
    }, 900);
  };
  const Swatches = ({ value, onPick }: { value: string; onPick: (c: string) => void }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SWATCHES.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${value.toLowerCase() === c.toLowerCase() ? "border-snow scale-110 shadow-lg" : "border-transparent"}`}
          style={{ background: c }}
          aria-label={c}
        />
      ))}
      <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-dashed border-[var(--glass-border)] grid place-items-center cursor-pointer hover:border-[var(--brand-line)] transition-colors" title="Custom">
        <Icon name="palette" className="w-3.5 h-3.5 text-moss" />
        <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </div>
  );

  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass sheen p-4 flex items-center gap-3 border-[var(--brand-line)]">
          <span className="w-10 h-10 rounded-xl grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] shrink-0"><Icon name="palette" className="w-5 h-5" /></span>
          <div className="flex-1">
            <div className="font-display font-bold text-snow">{t("brand.studio")}</div>
            <div className="text-[11px] text-moss mt-0.5">{t("brand.studioSub")}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { resetBrand(); toast(t("brand.removed"), "ember"); }} className="btn-ghost rounded-xl px-4 py-2 text-[11px] font-bold text-moss">{t("common.reset")}</button>
            <button onClick={() => toast(t("brand.published"), "brand")} className="btn-brand rounded-xl px-5 py-2 text-[11px] font-bold flex items-center gap-2"><Icon name="check" className="w-4 h-4" /> {t("common.publish")}</button>
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* controls */}
        <div className="grid gap-4 content-start">
          <Reveal delay={60}>
            <div className="glass p-5 grid sm:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.nameAr")}</span>
                <input value={brand.nameAr} onChange={(e) => setBrand({ nameAr: e.target.value })} className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors" />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.nameEn")}</span>
                <input value={brand.nameEn} onChange={(e) => setBrand({ nameEn: e.target.value })} dir="ltr" className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors" />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.initial")}</span>
                <input value={brand.initial} maxLength={2} onChange={(e) => setBrand({ initial: e.target.value })} className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors font-display font-bold" />
              </label>
              <div>
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.primary")}</span>
                <Swatches value={brand.accent} onPick={(c) => setBrand({ accent: c })} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.secondary")}</span>
                <Swatches value={brand.accent2} onPick={(c) => setBrand({ accent2: c })} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.radius")} — {brand.radius}px</span>
                <input type="range" min={8} max={26} value={brand.radius} onChange={(e) => setBrand({ radius: parseInt(e.target.value) })} className="w-full mt-2" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="glass p-5 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <UploadField labelKey="brand.logo" hintKey="brand.logoHint" field="logoUrl" value={brand.logoUrl} />
              <UploadField labelKey="brand.icon" hintKey="brand.iconHint" field="iconUrl" value={brand.iconUrl} />
              <UploadField labelKey="brand.banner" hintKey="brand.bannerHint" field="bannerUrl" value={brand.bannerUrl} />
              <UploadField labelKey="brand.bg" hintKey="brand.bgHint" field="bgUrl" value={brand.bgUrl} />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="glass p-5 grid sm:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.fontDisplay")}</span>
                <select value={brand.fontDisplay} onChange={(e) => setBrand({ fontDisplay: e.target.value })} className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none bg-[var(--color-panel)]">
                  {DISPLAY_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
                <span className="block mt-2 text-lg text-snow" style={{ fontFamily: `"${brand.fontDisplay}"` }}>FitPro ١٢٣</span>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.fontBody")}</span>
                <select value={brand.fontBody} onChange={(e) => setBrand({ fontBody: e.target.value })} className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none bg-[var(--color-panel)]">
                  {BODY_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
                <span className="block mt-2 text-xs text-moss leading-5" style={{ fontFamily: `"${brand.fontBody}"` }}>نص تجريبي لخط النصوص — The quick brown fox.</span>
              </label>
              <div>
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.defaultLang")}</span>
                <div className="flex gap-2">
                  {(["ar", "en"] as Lang[]).map((l) => (
                    <button key={l} onClick={() => { setBrand({ defaultLang: l }); toast(`${t("toast.lang")}: ${l === "ar" ? "العربية" : "English"}`, "sky"); }} className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all ${brand.defaultLang === l ? "tab-active" : "border-[var(--glass-border)] text-moss"}`}>
                      {l === "ar" ? "العربية" : "English"}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-moss2 mt-2.5 leading-4">{t("brand.adminOnly")}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={190}>
            <div className="glass p-5 grid lg:grid-cols-2 gap-5">
              <div>
                <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.domain")}</span>
                <div className="flex gap-2">
                  <input
                    dir="ltr" value={brand.domain}
                    onChange={(e) => setBrand({ domain: e.target.value })}
                    className="flex-1 chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors font-display"
                  />
                  <button onClick={checkDomain} disabled={checking} className="btn-ghost rounded-xl px-3.5 py-2 text-[10px] font-bold text-moss flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap">
                    {checking ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-3.5 h-3.5 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="search" className="w-3.5 h-3.5" />}
                    {t("brand.domainCheck")}
                  </button>
                </div>
                <p className="text-[9px] text-moss2 mt-2 leading-4">{t("brand.domainHint")}</p>
                <label className="block mt-4">
                  <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.welcome")}</span>
                  <input value={brand.welcome} onChange={(e) => setBrand({ welcome: e.target.value })} placeholder={t("brand.welcomePh")} className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors placeholder:text-moss2" />
                </label>
                <div className="mt-4">
                  <span className="text-[11px] font-bold text-moss block mb-1.5">{t("brand.memberMode")}</span>
                  <div className="flex gap-2">
                    {([["dark", { ar: "داكن 🌙", en: "Dark 🌙" }], ["light", { ar: "فاتح ☀️", en: "Light ☀️" }]] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setBrand({ memberMode: v })} className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all ${brand.memberMode === v ? "tab-active" : "border-[var(--glass-border)] text-moss"}`}>
                        {lang === "ar" ? l.ar : l.en}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-moss2 mt-2 leading-4">{t("brand.memberModeHint")}</p>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-moss block mb-2.5">{t("brand.modules")}</span>
                <div className="space-y-2.5">
                  {([
                    ["water", "brand.modWater", { ar: "أكواب الماء اليومية في الرئيسية", en: "Daily water cups on home" }],
                    ["scanner", "brand.modScanner", { ar: "تسجيل الوجبات الحرة بالباركود", en: "Log free meals by barcode" }],
                    ["photos", "brand.modPhotos", { ar: "مقارنات قبل/بعد الخاصة", en: "Private before/after gallery" }],
                    ["payments", "brand.modPayments", { ar: "التجديد والدفع داخل التطبيق", en: "Renew & pay inside the app" }],
                  ] as const).map(([key, labelKey, d]) => (
                    <div key={key} className="chip rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-snow">{t(labelKey)}</div>
                        <div className="text-[9px] text-moss mt-0.5">{lang === "ar" ? d.ar : d.en}</div>
                      </div>
                      <Switch on={brand.features[key]} onClick={() => { const next = !brand.features[key]; setBrand({ features: { ...brand.features, [key]: next } }); toast(`${t(labelKey)} — ${lang === "ar" ? (next ? "مفعّلة للأعضاء فوراً" : "أُخفيت من تطبيق الأعضاء") : next ? "enabled for members instantly" : "hidden from the member app"}`, next ? "mint" : "ember"); }} />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-moss2 mt-2.5 leading-4">{t("brand.modulesHint")}</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* live preview */}
        <Reveal delay={100}>
          <div className="glass p-5 lg:sticky lg:top-4 self-start">
            <SectionTitle icon="eye" title={t("brand.preview")} sub={t("brand.previewSub")} action={<span className="flex items-center gap-1.5 text-[10px] text-moss"><span className="w-2 h-2 rounded-full live-dot" style={{ background: "var(--brand)" }} />{t("common.live")}</span>} />
            <div className="rounded-3xl border border-[var(--glass-border)] overflow-hidden bg-[var(--color-bg)] shadow-2xl">
              <div className="relative h-16">
                {brand.bannerUrl ? <img src={brand.bannerUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: `linear-gradient(120deg, color-mix(in srgb, ${brand.accent} 50%, transparent), color-mix(in srgb, ${brand.accent2} 35%, transparent))` }} />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--color-bg), transparent)" }} />
              </div>
              <div className="px-4 -mt-6 relative flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl grid place-items-center font-display font-bold overflow-hidden shadow-lg" style={{ background: brand.accent, color: "#0b110d", borderRadius: Math.min(brand.radius, 18) }}>
                  {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="w-full h-full object-cover" /> : brand.initial}
                </span>
                <div>
                  <div className="font-display font-bold text-snow text-sm" style={{ fontFamily: `"${brand.fontDisplay}"` }}>{lang === "en" ? brand.nameEn : brand.nameAr}</div>
                  <div className="text-[9px] text-moss" style={{ fontFamily: `"${brand.fontBody}"` }}>{lang === "en" ? brand.nameAr : brand.nameEn}</div>
                </div>
                <span className="mr-auto flex items-center gap-1.5 text-[8px] font-bold px-2 py-1 rounded-full" style={{ color: brand.memberMode === "dark" ? "#7fb4ff" : "#c98a1e", background: "color-mix(in srgb, currentColor 12%, transparent)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
                  {brand.memberMode === "dark" ? (lang === "ar" ? "داكن" : "Dark") : (lang === "ar" ? "فاتح" : "Light")}
                </span>
              </div>
              {brand.welcome && (
                <div className="mx-4 mt-1.5 text-[9px] font-bold" style={{ color: brand.accent, fontFamily: `"${brand.fontBody}"` }}>{brand.welcome}</div>
              )}
              <div className="p-4 space-y-2.5">
                <div className="rounded-xl p-3 border" style={{ background: `color-mix(in srgb, ${brand.accent} 12%, transparent)`, borderColor: `color-mix(in srgb, ${brand.accent} 35%, transparent)`, borderRadius: brand.radius }}>
                  <div className="text-[10px] font-bold" style={{ color: brand.accent }}>{t("login.todayWorkout")}</div>
                  <div className="font-display font-bold text-snow text-xs mt-0.5">{t("login.pushDay")}</div>
                </div>
                <div className="flex gap-2">
                  <span className="btn-brand rounded-xl px-3 py-2 text-[10px] font-bold flex-1 text-center" style={{ borderRadius: brand.radius }}>{t("client.startWorkout")}</span>
                  <span className="btn-ghost rounded-xl px-3 py-2 text-[10px] font-bold text-moss" style={{ borderRadius: brand.radius }}>{t("nav.progress")}</span>
                </div>
                {brand.features.water && (
                  <div className="flex items-center justify-between chip rounded-xl px-3 py-2" style={{ borderRadius: brand.radius }}>
                    <span className="text-[10px] text-moss" style={{ fontFamily: `"${brand.fontBody}"` }}>{t("client.water")}</span>
                    <span className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i < 3 ? brand.accent2 : "var(--color-line2)" }} />)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ================= devices ================= */
function Devices() {
  const { toast, t } = useApp();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Record<string, string>>({ scale: "قبل 12 دقيقة", gate: "قبل دقيقة", hr: "قبل 4 دقائق", screen: "—" });
  const [screenOn, setScreenOn] = useState(false);

  const devices: { id: string; icon: IconName; name: string; model: string; online: boolean; note: string }[] = [
    { id: "scale", icon: "target", name: "ميزان تركيب الجسم", model: "InBody 270S", online: true, note: "يزن أعضاء الصالة ويرسل القياسات لملفاتهم تلقائياً" },
    { id: "gate", icon: "shield", name: "بوابات الدخول", model: "ZKTech × 3", online: true, note: "تحقق بالبصمة وQR — تسجل حضور كل عضو" },
    { id: "hr", icon: "heart", name: "أجهزة النبض الجماعية", model: "MyZone MZ-Switch", online: true, note: "14 جهازاً موزعة في منطقة الكارديو" },
    { id: "screen", icon: "bars", name: "شاشة العرض الرئيسية", model: "Dashboard TV", online: screenOn, note: "تبث مؤشرات الصالة الحية في البهو" },
  ];

  const sync = (id: string, label: string) => {
    setSyncing(id);
    window.setTimeout(() => {
      setSyncing(null);
      setLastSync((s) => ({ ...s, [id]: "الآن" }));
      toast(id === "scale" ? "تم استلام 14 قياساً جديداً من الميزان وحُدّثت ملفات الأعضاء" : `تمت مزامنة «${label}» بنجاح`, "mint");
    }, 1400);
  };

  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {devices.map((d, i) => (
          <Reveal key={d.id} delay={i * 60}>
            <div className="glass panel-hover p-5 relative overflow-hidden">
              <div className="absolute -top-10 -end-10 w-32 h-32 rounded-full blur-2xl opacity-25" style={{ background: d.online ? "var(--brand)" : "var(--color-line2)" }} />
              <div className="flex items-start gap-3.5 relative">
                <span className="relative w-12 h-12 rounded-2xl grid place-items-center chip shrink-0" style={{ color: d.online ? "var(--brand)" : "var(--color-moss2)" }}>
                  <Icon name={d.icon} className="w-6 h-6" />
                  <span className={`absolute -top-1 -end-1 w-3 h-3 rounded-full border-2 border-[var(--color-panel)] ${d.online ? "bg-mint live-dot" : "bg-blush"}`} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-snow font-display">{d.name}</span>
                    <Badge tone={d.online ? "mint" : "blush"}>{d.online ? t("dev.online") : t("dev.offline")}</Badge>
                  </div>
                  <div className="text-[10px] text-moss2 mt-0.5" dir="ltr">{d.model}</div>
                  <p className="text-[11px] text-moss mt-2 leading-5">{d.note}</p>
                  <div className="flex items-center justify-between mt-3.5">
                    <span className="text-[10px] text-moss2">{t("dev.lastSync")}: <b className="text-snow">{lastSync[d.id]}</b></span>
                    {d.id === "screen" ? (
                      <button onClick={() => { setScreenOn(true); setLastSync((s) => ({ ...s, screen: "الآن" })); toast("أُعيد تشغيل الشاشة — تعرض المؤشرات الحية الآن", "sky"); }} className="btn-ghost rounded-xl px-3.5 py-2 text-[10px] font-bold text-moss">{t("dev.restart")}</button>
                    ) : (
                      <button
                        onClick={() => sync(d.id, d.name)}
                        disabled={syncing === d.id}
                        className="btn-brand rounded-xl px-3.5 py-2 text-[10px] font-bold flex items-center gap-2 disabled:opacity-70"
                      >
                        {syncing === d.id ? (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-3.5 h-3.5 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg>{t("dev.syncing")}</>) : (<><Icon name="bolt" className="w-3.5 h-3.5" />{t("dev.syncNow")}</>)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="glass p-5">
          <SectionTitle icon="heart" title={t("dev.memberDevices")} sub="ساعات وأساور وموازين ذكية ربطها الأعضاء بحساباتهم" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { k: "ساعة/سوار مرتبط", v: "212", icon: "heart" as IconName, tone: "var(--brand)" },
              { k: "مزامنة اليوم", v: "1,847", icon: "bolt" as IconName, tone: "#FF8A3C" },
              { k: "قياسات ميزان هذا الأسبوع", v: "96", icon: "target" as IconName, tone: "#45D6C0" },
            ].map((x) => (
              <div key={x.k} className="chip rounded-2xl p-4 flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${x.tone} 12%, transparent)`, color: x.tone, border: `1px solid color-mix(in srgb, ${x.tone} 35%, transparent)` }}>
                  <Icon name={x.icon} className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-display font-extrabold text-xl text-snow">{x.v}</div>
                  <div className="text-[10px] text-moss">{x.k}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ================= settings center ================= */
const inputCls = "w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors";

function GeneralSection() {
  const L = useL();
  const { gym, toast } = useApp();
  const slug = gym.nameEn.toLowerCase().replace(/[^a-z]+/g, "");
  const [info, setInfo] = useState({ city: gym.city, address: "حي العليا، شارع التخصصي", phone: "+966 55 210 8890", email: `hello@${slug}.sa` });
  const DAYS = [
    { ar: "السبت", en: "Sat" }, { ar: "الأحد", en: "Sun" }, { ar: "الاثنين", en: "Mon" }, { ar: "الثلاثاء", en: "Tue" },
    { ar: "الأربعاء", en: "Wed" }, { ar: "الخميس", en: "Thu" }, { ar: "الجمعة", en: "Fri" },
  ];
  const [days, setDays] = useState([true, true, true, true, true, true, false]);
  const [hours, setHours] = useState({ open: "06:00", close: "23:30" });
  const [tz, setTz] = useState("GMT+3");
  const [currency, setCurrency] = useState("SAR");
  const [weekStart, setWeekStart] = useState<"sat" | "mon">("sat");
  const saveLbl = L({ ar: "حفظ الإعدادات العامة", en: "Save general settings" });
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="settings" title={L({ ar: "بيانات الصالة", en: "Gym details" })} sub={L({ ar: "تظهر في الفواتير وبوابة الدخول وتطبيق الأعضاء", en: "Shown on invoices, login & the member app" })} />
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            ["city", L({ ar: "المدينة", en: "City" }), "rtl"],
            ["address", L({ ar: "العنوان", en: "Address" }), "rtl"],
            ["phone", L({ ar: "الهاتف", en: "Phone" }), "ltr"],
            ["email", L({ ar: "البريد الرسمي", en: "Official email" }), "ltr"],
          ] as const).map(([k, label, dir]) => (
            <label key={k} className="block">
              <span className="text-[11px] font-bold text-moss block mb-1.5">{label}</span>
              <input dir={dir} value={info[k]} onChange={(e) => setInfo((s) => ({ ...s, [k]: e.target.value }))} className={inputCls} />
            </label>
          ))}
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="clock" title={L({ ar: "ساعات العمل", en: "Opening hours" })} sub={L({ ar: "تُفعَّل بوابات الدخول تلقائياً خارج هذه الأوقات", en: "Entry gates lock automatically outside these hours" })} />
        <div className="flex gap-1.5 flex-wrap mb-4">
          {DAYS.map((d, i) => (
            <button key={d.en} onClick={() => setDays((s) => s.map((x, j) => (j === i ? !x : x)))} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${days[i] ? "tab-active" : "border-[var(--glass-border)] text-moss2 line-through"}`}>
              {L(d)}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "يفتح", en: "Opens" })}</span>
            <input type="time" dir="ltr" value={hours.open} onChange={(e) => setHours((s) => ({ ...s, open: e.target.value }))} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "يغلق", en: "Closes" })}</span>
            <input type="time" dir="ltr" value={hours.close} onChange={(e) => setHours((s) => ({ ...s, close: e.target.value }))} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "المنطقة الزمنية", en: "Timezone" })}</span>
            <select value={tz} onChange={(e) => setTz(e.target.value)} className={inputCls}>
              {["GMT+3", "GMT+4", "GMT+0", "GMT+1"].map((z) => <option key={z} value={z} className="bg-[var(--color-panel)]">{z}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="grid" title={L({ ar: "المحلية والفوترة", en: "Locale & billing" })} sub={L({ ar: "العملة وبداية الأسبوع لكل التقارير", en: "Currency & week start across all reports" })} />
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "العملة", en: "Currency" })}</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
              {[["SAR", "ر.س"], ["USD", "$"], ["AED", "د.إ"], ["EUR", "€"]].map(([c, s]) => <option key={c} value={c} className="bg-[var(--color-panel)]">{c} — {s}</option>)}
            </select>
          </label>
          <div>
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "بداية الأسبوع", en: "Week starts on" })}</span>
            <div className="flex gap-2">
              {([["sat", { ar: "السبت", en: "Saturday" }], ["mon", { ar: "الاثنين", en: "Monday" }]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setWeekStart(v)} className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all ${weekStart === v ? "tab-active" : "border-[var(--glass-border)] text-moss"}`}>{L(l)}</button>
              ))}
            </div>
          </div>
          <button onClick={() => toast(L({ ar: "حُفظت الإعدادات العامة وطُبّقت فوراً", en: "General settings saved & applied" }), "brand")} className="btn-brand rounded-xl px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2">
            <Icon name="check" className="w-4 h-4" /> {saveLbl}
          </button>
        </div>
      </div>
    </>
  );
}

interface MemberPlan { id: string; name: { ar: string; en: string }; price: number; cycle: "monthly" | "quarterly" | "yearly"; active: boolean; perks: { pool: boolean; sauna: boolean; pt: boolean; freeze: boolean }; custom?: boolean }
const PERKS: { key: keyof MemberPlan["perks"]; ar: string; en: string }[] = [
  { key: "pool", ar: "مسبح", en: "Pool" }, { key: "sauna", ar: "ساونا", en: "Sauna" },
  { key: "pt", ar: "جلسة PT مجانية", en: "Free PT session" }, { key: "freeze", ar: "تجميد شهري", en: "Monthly freeze" },
];

function PlansSection() {
  const L = useL();
  const { toast, lang } = useApp();
  const [plans, setPlans] = useState<MemberPlan[]>([
    { id: "basic", name: { ar: "أساسية", en: "Basic" }, price: 149, cycle: "monthly", active: true, perks: { pool: false, sauna: false, pt: false, freeze: false } },
    { id: "premium", name: { ar: "بريميوم", en: "Premium" }, price: 299, cycle: "monthly", active: true, perks: { pool: true, sauna: true, pt: false, freeze: true } },
    { id: "vip", name: { ar: "VIP", en: "VIP" }, price: 499, cycle: "quarterly", active: true, perks: { pool: true, sauna: true, pt: true, freeze: true } },
    { id: "trial", name: { ar: "تجريبية", en: "Trial" }, price: 0, cycle: "monthly", active: true, perks: { pool: false, sauna: false, pt: false, freeze: false } },
  ]);
  const CYCLES: Record<MemberPlan["cycle"], { ar: string; en: string }> = {
    monthly: { ar: "شهري", en: "Monthly" }, quarterly: { ar: "ربع سنوي", en: "Quarterly" }, yearly: { ar: "سنوي", en: "Yearly" },
  };
  return (
    <>
      <div className="glass p-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] text-xs text-moss">
          {L({ ar: "أسعار العضويات تظهر للأعضاء في شاشة الاشتراك وتُحدّث الفوترة فور الحفظ.", en: "Prices appear to members on the subscribe screen & update billing on save." })}
        </div>
        <button
          onClick={() => { setPlans((p) => [...p, { id: `p${Date.now()}`, name: { ar: "باقة جديدة", en: "New Plan" }, price: 199, cycle: "monthly", active: true, perks: { pool: false, sauna: false, pt: false, freeze: false }, custom: true }]); toast(L({ ar: "أُضيفت باقة — عدّل اسمها وسعرها", en: "Plan added — edit its name & price" }), "mint"); }}
          className="btn-brand rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2"
        >
          <Icon name="plus" className="w-4 h-4" /> {L({ ar: "إضافة باقة", en: "Add plan" })}
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div key={p.id} className={`glass panel-hover p-5 ${!p.active ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between mb-3.5">
              <input value={L(p.name)} onChange={(e) => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: { ...x.name, [lang]: e.target.value } } : x)))} className="bg-transparent outline-none font-display font-bold text-snow text-base w-28 border-b border-transparent focus:border-[var(--brand-line)] transition-colors" />
              <div className="flex items-center gap-2.5">
                {p.custom && (
                  <button onClick={() => { setPlans((ps) => ps.filter((x) => x.id !== p.id)); toast(L({ ar: `حُذفت «${p.name.ar}»`, en: `Deleted "${p.name.en}"` }), "ember"); }} className="w-7 h-7 rounded-lg chip grid place-items-center text-moss hover:text-blush hover:!border-blush/50 transition-colors" aria-label="delete">
                    <Icon name="trash" className="w-3.5 h-3.5" />
                  </button>
                )}
                <Switch on={p.active} onClick={() => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))} />
              </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <label className="flex-1">
                <span className="text-[10px] text-moss block mb-1">{L({ ar: "السعر", en: "Price" })}</span>
                <span className="flex items-center gap-2">
                  <input type="number" min={0} value={p.price} onChange={(e) => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, price: Math.max(0, parseInt(e.target.value) || 0) } : x)))} className={`${inputCls} font-display font-bold text-lg`} />
                  <span className="text-[10px] text-moss2 whitespace-nowrap pb-2.5">ر.س</span>
                </span>
              </label>
              <label className="w-32">
                <span className="text-[10px] text-moss block mb-1">{L({ ar: "الدورة", en: "Cycle" })}</span>
                <select value={p.cycle} onChange={(e) => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, cycle: e.target.value as MemberPlan["cycle"] } : x)))} className={inputCls}>
                  {(Object.keys(CYCLES) as MemberPlan["cycle"][]).map((c) => <option key={c} value={c} className="bg-[var(--color-panel)]">{L(CYCLES[c])}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PERKS.map((pk) => (
                <button
                  key={pk.key}
                  onClick={() => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, perks: { ...x.perks, [pk.key]: !x.perks[pk.key] } } : x)))}
                  className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition-all ${p.perks[pk.key] ? "tab-active" : "border-[var(--glass-border)] text-moss2"}`}
                >
                  {p.perks[pk.key] ? "✓ " : ""}{L(pk)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => toast(L({ ar: "نُشرت الأسعار الجديدة على متجر العضويات", en: "New prices published to the membership store" }), "brand")} className="btn-brand rounded-xl px-6 py-3 text-xs font-bold flex items-center gap-2 justify-self-start">
        <Icon name="check" className="w-4 h-4" /> {L({ ar: "نشر الأسعار", en: "Publish pricing" })}
      </button>
    </>
  );
}

function NotifSection() {
  const L = useL();
  const { toast } = useApp();
  const [ch, setCh] = useState({ email: true, sms: false, push: true });
  const [ev, setEv] = useState({ welcome: true, session: true, expiry: true, report: true, invoice: false });
  const [expDays, setExpDays] = useState(7);
  const [quiet, setQuiet] = useState({ on: true, from: "22:00", to: "07:00" });
  const [sending, setSending] = useState(false);
  const Row = ({ on, onClick, k, d }: { on: boolean; onClick: () => void; k: string; d: string }) => (
    <div className="chip rounded-xl p-3.5 flex items-center gap-3">
      <div className="flex-1"><div className="text-xs font-bold text-snow">{k}</div><div className="text-[10px] text-moss mt-0.5">{d}</div></div>
      <Switch on={on} onClick={onClick} />
    </div>
  );
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="bell" title={L({ ar: "قنوات الإرسال", en: "Delivery channels" })} sub={L({ ar: "SMS برسوم لكل رسالة — Email وPush مجانيان", en: "SMS is metered — Email & Push are free" })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Row on={ch.email} onClick={() => setCh((s) => ({ ...s, email: !s.email }))} k="Email" d={L({ ar: "قوالب مصممة بعلامتك", en: "Templates styled with your brand" })} />
          <Row on={ch.sms} onClick={() => setCh((s) => ({ ...s, sms: !s.sms }))} k="SMS" d={L({ ar: "0.12 ر.س / رسالة", en: "0.12 SAR / message" })} />
          <Row on={ch.push} onClick={() => setCh((s) => ({ ...s, push: !s.push }))} k="Push" d={L({ ar: "إشعارات تطبيق الأعضاء", en: "Member app notifications" })} />
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="spark" title={L({ ar: "أحداث تُرسل تلقائياً", en: "Automatic triggers" })} sub={L({ ar: "تُرسل فور وقوع الحدث دون تدخل", en: "Sent the moment the event happens" })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Row on={ev.welcome} onClick={() => setEv((s) => ({ ...s, welcome: !s.welcome }))} k={L({ ar: "ترحيب عضو جديد", en: "New member welcome" })} d={L({ ar: "رسالة + جولة تعريفية في التطبيق", en: "Message + in-app tour" })} />
          <Row on={ev.session} onClick={() => setEv((s) => ({ ...s, session: !s.session }))} k={L({ ar: "تذكير جلسة تدريب", en: "Session reminder" })} d={L({ ar: "قبل الجلسة بساعتين", en: "2h before the session" })} />
          <Row on={ev.expiry} onClick={() => setEv((s) => ({ ...s, expiry: !s.expiry }))} k={L({ ar: "انتهاء العضوية", en: "Membership expiry" })} d={L({ ar: "تذكير متدرج قبل الانتهاء", en: "Staged reminders before expiry" })} />
          <Row on={ev.report} onClick={() => setEv((s) => ({ ...s, report: !s.report }))} k={L({ ar: "تقرير أسبوعي للمدرب", en: "Weekly coach report" })} d={L({ ar: "التزام وأوزان عملائه", en: "Client adherence & weights" })} />
          <Row on={ev.invoice} onClick={() => setEv((s) => ({ ...s, invoice: !s.invoice }))} k={L({ ar: "إيصال تجديد", en: "Renewal receipt" })} d={L({ ar: "فاتورة PDF بالبريد", en: "PDF invoice by email" })} />
        </div>
        {ev.expiry && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-[11px] text-moss whitespace-nowrap">{L({ ar: "التذكير قبل الانتهاء بـ", en: "Remind" })}</span>
            <input type="range" min={1} max={14} value={expDays} onChange={(e) => setExpDays(parseInt(e.target.value))} className="flex-1" />
            <span className="font-display font-bold text-[var(--brand)] w-16 text-center">{expDays} {L({ ar: "يوم", en: "days" })}</span>
          </div>
        )}
      </div>
      <div className="glass p-5 flex flex-wrap items-center gap-4">
        <Switch on={quiet.on} onClick={() => setQuiet((s) => ({ ...s, on: !s.on }))} tone="#45D6C0" />
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs font-bold text-snow">{L({ ar: "ساعات الهدوء", en: "Quiet hours" })}</div>
          <div className="text-[10px] text-moss mt-0.5">{L({ ar: "لا إشعارات للأعضاء خلال هذه الفترة", en: "No member notifications during this window" })}</div>
        </div>
        <input type="time" dir="ltr" disabled={!quiet.on} value={quiet.from} onChange={(e) => setQuiet((s) => ({ ...s, from: e.target.value }))} className={`${inputCls} w-28 disabled:opacity-40`} />
        <span className="text-moss2 text-xs">—</span>
        <input type="time" dir="ltr" disabled={!quiet.on} value={quiet.to} onChange={(e) => setQuiet((s) => ({ ...s, to: e.target.value }))} className={`${inputCls} w-28 disabled:opacity-40`} />
        <button
          onClick={() => { setSending(true); window.setTimeout(() => { setSending(false); toast(L({ ar: "وصلك إشعار تجريبي على القنوات المفعّلة ✓", en: "Test notification delivered on active channels ✓" }), "mint"); }, 1100); }}
          disabled={sending}
          className="btn-ghost rounded-xl px-4 py-2.5 text-[11px] font-bold text-moss flex items-center gap-2 disabled:opacity-60"
        >
          {sending ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="bolt" className="w-4 h-4" />}
          {sending ? L({ ar: "جارٍ الإرسال…", en: "Sending…" }) : L({ ar: "إرسال اختباري", en: "Send test" })}
        </button>
      </div>
    </>
  );
}

function SecuritySection() {
  const L = useL();
  const { toast } = useApp();
  const [twoFA, setTwoFA] = useState(true);
  const [timeout, setTimeoutV] = useState("8h");
  const [policy, setPolicy] = useState("strong");
  const [attempts, setAttempts] = useState(5);
  const [sessions, setSessions] = useState([
    { id: 1, dev: "Chrome — macOS", loc: { ar: "الرياض، السعودية", en: "Riyadh, SA" }, time: { ar: "الآن · هذا الجهاز", en: "Now · this device" }, current: true },
    { id: 2, dev: "iPhone 15 — FitPro App", loc: { ar: "جدة، السعودية", en: "Jeddah, SA" }, time: { ar: "قبل ساعة", en: "1h ago" }, current: false },
    { id: 3, dev: "Windows — Edge", loc: { ar: "الدمام، السعودية", en: "Dammam, SA" }, time: { ar: "قبل يومين", en: "2d ago" }, current: false },
  ]);
  const policies = [
    { id: "basic", ar: "عادية", en: "Basic", dAr: "8 أحرف على الأقل", dEn: "8+ characters" },
    { id: "strong", ar: "قوية", en: "Strong", dAr: "12+ مع رمز ورقم", dEn: "12+ with symbol & digit" },
    { id: "max", ar: "قصوى", en: "Maximum", dAr: "16+ وتغيير كل 90 يوم", dEn: "16+ rotated every 90 days" },
  ];
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="shield" title={L({ ar: "حماية الحسابات الإدارية", en: "Admin account protection" })} sub={L({ ar: "تنطبق على الإدارة والمدربين", en: "Applies to admins & trainers" })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="chip rounded-xl p-3.5 flex items-center gap-3">
            <div className="flex-1"><div className="text-xs font-bold text-snow">{L({ ar: "التحقق بخطوتين (2FA)", en: "Two-factor auth (2FA)" })}</div><div className="text-[10px] text-moss mt-0.5">{L({ ar: "إلزامي لكل حساب إداري", en: "Required for every admin account" })}</div></div>
            <Switch on={twoFA} onClick={() => { setTwoFA(!twoFA); toast(!twoFA ? L({ ar: "فُعّل 2FA — يُطلب عند الدخول القادم", en: "2FA on — required at next login" }) : L({ ar: "أُوقف 2FA — غير موصى به", en: "2FA off — not recommended" }), !twoFA ? "mint" : "ember"); }} />
          </div>
          <label className="chip rounded-xl p-3.5 flex items-center gap-3">
            <div className="flex-1"><div className="text-xs font-bold text-snow">{L({ ar: "انتهاء الجلسة", en: "Session timeout" })}</div><div className="text-[10px] text-moss mt-0.5">{L({ ar: "خروج تلقائي بعد خمول", en: "Auto sign-out after idle" })}</div></div>
            <select value={timeout} onChange={(e) => setTimeoutV(e.target.value)} className="chip rounded-lg px-2 py-1.5 text-[10px] font-bold text-snow bg-transparent outline-none">
              {[["30m", "30 " + L({ ar: "دقيقة", en: "min" })], ["2h", "2 " + L({ ar: "ساعة", en: "hours" })], ["8h", "8 " + L({ ar: "ساعات", en: "hours" })], ["24h", L({ ar: "يوم", en: "1 day" })]].map(([v, l]) => <option key={v} value={v} className="bg-[var(--color-panel)]">{l}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4">
          <span className="text-[11px] font-bold text-moss block mb-2">{L({ ar: "سياسة كلمات المرور", en: "Password policy" })}</span>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {policies.map((p) => (
              <button key={p.id} onClick={() => setPolicy(p.id)} className={`rounded-xl border p-3 text-right transition-all ${policy === p.id ? "tab-active" : "border-[var(--glass-border)] hover:border-[var(--glass-hi)]"}`}>
                <div className="text-xs font-bold">{L(p)}</div>
                <div className={`text-[9px] mt-0.5 ${policy === p.id ? "opacity-80" : "text-moss2"}`}>{L({ ar: p.dAr, en: p.dEn })}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-[11px] text-moss">{L({ ar: "محاولات دخول قبل القفل", en: "Login attempts before lockout" })}</span>
          <Stepper value={attempts} onChange={setAttempts} min={3} max={10} />
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="eye" title={L({ ar: "الجلسات النشطة", en: "Active sessions" })} sub={L({ ar: "أجهزة الإدارة والمدربين المسجّل دخولها", en: "Signed-in admin & trainer devices" })} />
        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div key={s.id} className="chip rounded-xl p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] shrink-0"><Icon name="shield" className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-snow flex items-center gap-2">{s.dev} {s.current && <Badge tone="mint">{L({ ar: "هذا الجهاز", en: "This device" })}</Badge>}</div>
                <div className="text-[10px] text-moss mt-0.5">{L(s.loc)} · {L(s.time)}</div>
              </div>
              {!s.current && (
                <button onClick={() => { setSessions((x) => x.filter((y) => y.id !== s.id)); toast(L({ ar: "أُنهيت الجلسة وأُشعر صاحبها بالبريد", en: "Session revoked & owner notified" }), "ember"); }} className="btn-ghost rounded-lg px-3 py-1.5 text-[10px] font-bold text-blush">
                  {L({ ar: "إنهاء", en: "Revoke" })}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PaymentsSection() {
  const L = useL();
  const { toast } = useApp();
  const [providers, setProviders] = useState({ moyasar: true, stripe: false, hyperpay: false, applepay: false });
  const [autoRenew, setAutoRenew] = useState(true);
  const [prefix, setPrefix] = useState("FP-");
  const [vat, setVat] = useState("310123456700003");
  const [payout, setPayout] = useState("weekly");
  const rows: { key: keyof typeof providers; name: string; badge: { ar: string; en: string } | null; d: { ar: string; en: string } }[] = [
    { key: "moyasar", name: "Moyasar", badge: { ar: "مباشر", en: "Live" }, d: { ar: "مدى، فيزا، ماستركارد، Apple Pay", en: "mada, Visa, Mastercard, Apple Pay" } },
    { key: "stripe", name: "Stripe", badge: { ar: "تجريبي", en: "Test mode" }, d: { ar: "للاشتراكات الدولية", en: "For international billing" } },
    { key: "hyperpay", name: "HyperPay", badge: null, d: { ar: "بوابة خليجية بديلة", en: "Alternative GCC gateway" } },
    { key: "applepay", name: "Apple Pay", badge: null, d: { ar: "دفع مباشر عبر Moyasar", en: "Direct pay via Moyasar" } },
  ];
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="chart" title={L({ ar: "مزوّدو الدفع", en: "Payment providers" })} sub={L({ ar: "فعّل أكثر من مزوّد — يختار العضو عند الدفع", en: "Enable several — members choose at checkout" })} />
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.key} className="chip rounded-xl p-3.5 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs font-bold text-snow flex items-center gap-2" dir="ltr">{r.name} {r.badge && <Badge tone={providers[r.key] ? (r.badge.en === "Live" ? "mint" : "ember") : "moss"}>{L(r.badge)}</Badge>}</div>
                <div className="text-[10px] text-moss mt-0.5">{L(r.d)}</div>
              </div>
              <Switch on={providers[r.key]} onClick={() => setProviders((s) => ({ ...s, [r.key]: !s[r.key] }))} />
            </div>
          ))}
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="edit" title={L({ ar: "الفوترة", en: "Invoicing" })} sub={L({ ar: "تنسيق الفواتير والضريبة والتحويلات", en: "Invoice format, tax & payouts" })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "بادئة رقم الفاتورة", en: "Invoice prefix" })}</span>
            <input dir="ltr" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={`${inputCls} font-display font-bold`} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "الرقم الضريبي (VAT)", en: "VAT number" })}</span>
            <input dir="ltr" value={vat} onChange={(e) => setVat(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "جدول التحويلات البنكية", en: "Payout schedule" })}</span>
            <select value={payout} onChange={(e) => setPayout(e.target.value)} className={inputCls}>
              {[["weekly", { ar: "أسبوعي — كل أحد", en: "Weekly — Sundays" }], ["biweekly", { ar: "نصف شهري", en: "Bi-weekly" }], ["monthly", { ar: "شهري — أول الشهر", en: "Monthly — 1st" }]].map(([v, l]) => <option key={v as string} value={v as string} className="bg-[var(--color-panel)]">{L(l as { ar: string; en: string })}</option>)}
            </select>
          </label>
          <div className="chip rounded-xl p-3.5 flex items-center gap-3">
            <div className="flex-1"><div className="text-xs font-bold text-snow">{L({ ar: "تجديد تلقائي", en: "Auto-renewal" })}</div><div className="text-[10px] text-moss mt-0.5">{L({ ar: "خصم العضوية عند انتهائها بموافقة العضو", en: "Charge on expiry with member consent" })}</div></div>
            <Switch on={autoRenew} onClick={() => setAutoRenew(!autoRenew)} tone="#FF8A3C" />
          </div>
        </div>
        <button onClick={() => toast(L({ ar: "حُفظت إعدادات الدفع — تُطبق على الفاتورة القادمة", en: "Payment settings saved — applied to next invoice" }), "brand")} className="btn-brand rounded-xl px-5 py-2.5 text-xs font-bold mt-4 flex items-center gap-2">
          <Icon name="check" className="w-4 h-4" /> {L({ ar: "حفظ إعدادات الدفع", en: "Save payment settings" })}
        </button>
      </div>
    </>
  );
}

function ApiSection() {
  const L = useL();
  const { toast, gym } = useApp();
  const slug = gym.nameEn.toLowerCase().replace(/[^a-z]+/g, "");
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("fp_live_8fK2mQ9xRt1vBn4cYw7z3f2a");
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [hookUrl, setHookUrl] = useState(`https://api.${slug}.sa/webhooks/fitpro`);
  const [hookEvents, setHookEvents] = useState<Record<string, boolean>>({ "member.created": true, "member.expired": true, "checkin.submitted": true, "scale.synced": false });
  const [ints, setInts] = useState<Record<string, "idle" | "busy" | "on">>({ zapier: "idle", whatsapp: "idle", gcal: "idle" });
  const masked = apiKey.slice(0, 8) + "••••••••" + apiKey.slice(-4);
  const copy = () => {
    try { navigator.clipboard?.writeText(apiKey); } catch { /* noop */ }
    toast(L({ ar: "نُسخ المفتاح إلى الحافظة", en: "Key copied to clipboard" }), "mint");
  };
  const regen = () => {
    if (!confirmRegen) { setConfirmRegen(true); window.setTimeout(() => setConfirmRegen(false), 3000); return; }
    const rand = Array.from({ length: 24 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
    setApiKey(`fp_live_${rand}`);
    setConfirmRegen(false);
    toast(L({ ar: "وُلّد مفتاح جديد — أوقف المفتاح القديم فوراً", en: "New key generated — old key revoked" }), "ember");
  };
  const connect = (k: string, name: string) => {
    setInts((s) => ({ ...s, [k]: "busy" }));
    window.setTimeout(() => { setInts((s) => ({ ...s, [k]: "on" })); toast(L({ ar: `ارتبط ${name} بحساب الصالة ✓`, en: `${name} connected to the gym ✓` }), "mint"); }, 1200);
  };
  const intRows = [
    { k: "zapier", name: "Zapier", d: { ar: "أتمتة مع 5000+ تطبيق", en: "Automate with 5000+ apps" } },
    { k: "whatsapp", name: "WhatsApp Business", d: { ar: "تذكيرات عبر واتساب", en: "Reminders over WhatsApp" } },
    { k: "gcal", name: "Google Calendar", d: { ar: "مزامنة مواعيد الجلسات", en: "Sync session bookings" } },
  ];
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="bolt" title="REST API" sub={L({ ar: "مفتاح مباشر بصلاحيات هذه الصالة فقط (Tenant-scoped)", en: "Live key scoped to this gym tenant only" })} />
        <div className="chip rounded-xl p-3.5 flex items-center gap-3 flex-wrap">
          <code dir="ltr" className="font-display font-bold text-sm text-[var(--brand)] tracking-wide flex-1 min-w-[200px]">{showKey ? apiKey : masked}</code>
          <button onClick={() => setShowKey((s) => !s)} className="btn-ghost rounded-lg px-3 py-1.5 text-[10px] font-bold text-moss flex items-center gap-1.5"><Icon name="eye" className="w-3.5 h-3.5" /> {showKey ? L({ ar: "إخفاء", en: "Hide" }) : L({ ar: "عرض", en: "Show" })}</button>
          <button onClick={copy} className="btn-ghost rounded-lg px-3 py-1.5 text-[10px] font-bold text-moss flex items-center gap-1.5"><Icon name="edit" className="w-3.5 h-3.5" /> {L({ ar: "نسخ", en: "Copy" })}</button>
          <button onClick={regen} className={`btn-ghost rounded-lg px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 ${confirmRegen ? "!border-blush/60 text-blush" : "text-moss"}`}>
            <Icon name="spark" className="w-3.5 h-3.5" /> {confirmRegen ? L({ ar: "متأكد؟ انقر مجدداً", en: "Sure? Click again" }) : L({ ar: "توليد جديد", en: "Regenerate" })}
          </button>
        </div>
        <p className="text-[9px] text-moss2 mt-2.5 leading-4">{L({ ar: "حد المعدل: 300 طلب/دقيقة — التوثيق الكامل: docs.fitpro.app", en: "Rate limit: 300 req/min — full docs at docs.fitpro.app" })}</p>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="bell" title="Webhooks" sub={L({ ar: "استدعاء فوري لأنظمتك عند كل حدث", en: "Instant callbacks to your systems on every event" })} />
        <input dir="ltr" value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} className={`${inputCls} mb-3`} />
        <div className="flex gap-1.5 flex-wrap mb-4">
          {Object.keys(hookEvents).map((e) => (
            <button key={e} onClick={() => setHookEvents((s) => ({ ...s, [e]: !s[e] }))} dir="ltr" className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold font-display transition-all ${hookEvents[e] ? "tab-active" : "border-[var(--glass-border)] text-moss2"}`}>
              {hookEvents[e] ? "✓ " : ""}{e}
            </button>
          ))}
        </div>
        <button onClick={() => toast(L({ ar: "أُرسلت دفعة اختبار — استجاب الخادم بـ 200 OK", en: "Test payload sent — your server responded 200 OK" }), "mint")} className="btn-ghost rounded-xl px-4 py-2 text-[11px] font-bold text-moss flex items-center gap-2">
          <Icon name="bolt" className="w-4 h-4" /> {L({ ar: "إرسال حدث تجريبي", en: "Fire test event" })}
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {intRows.map((x) => (
          <div key={x.k} className="glass panel-hover p-4 flex flex-col">
            <div className="font-display font-bold text-snow text-sm" dir="ltr">{x.name}</div>
            <div className="text-[10px] text-moss mt-1 flex-1">{L(x.d)}</div>
            <button
              onClick={() => ints[x.k] === "idle" && connect(x.k, x.name)}
              disabled={ints[x.k] !== "idle"}
              className={`mt-3 rounded-xl py-2 text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${ints[x.k] === "on" ? "chip text-mint !border-mint/50" : "btn-brand"}`}
            >
              {ints[x.k] === "busy" ? (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-3.5 h-3.5 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg>{L({ ar: "جارٍ الربط…", en: "Connecting…" })}</>) : ints[x.k] === "on" ? (<><Icon name="check" className="w-3.5 h-3.5" />{L({ ar: "مرتبط", en: "Connected" })}</>) : L({ ar: "ربط", en: "Connect" })}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function DataSection() {
  const L = useL();
  const { toast } = useApp();
  const [backing, setBacking] = useState(false);
  const [lastBackup, setLastBackup] = useState({ ar: "اليوم 03:00 ص", en: "Today 03:00 AM" });
  const [schedule, setSchedule] = useState("daily");
  const [confirmDel, setConfirmDel] = useState("");
  const backupNow = () => {
    setBacking(true);
    window.setTimeout(() => {
      setBacking(false);
      const now = new Date();
      setLastBackup({ ar: `الآن ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, en: `Just now ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}` });
      toast(L({ ar: "اكتملت النسخة (4.2GB) ورُفعت مشفَّرة إلى S3", en: "Backup complete (4.2GB) — encrypted to S3" }), "mint");
    }, 1600);
  };
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="layers" title={L({ ar: "النسخ الاحتياطي", en: "Backups" })} sub={L({ ar: `آخر نسخة: ${L(lastBackup)} · تُخزَّن 30 يوماً مع استعادة نقطة زمنية`, en: `Last: ${L(lastBackup)} · kept 30 days with point-in-time restore` })} />
        <div className="flex flex-wrap items-center gap-3">
          <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className={`${inputCls} w-44`}>
            {[["daily", { ar: "يومي — 03:00 ص", en: "Daily — 03:00 AM" }], ["weekly", { ar: "أسبوعي — الجمعة", en: "Weekly — Friday" }]].map(([v, l]) => <option key={v as string} value={v as string} className="bg-[var(--color-panel)]">{L(l as { ar: string; en: string })}</option>)}
          </select>
          <button onClick={backupNow} disabled={backing} className="btn-brand rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-70">
            {backing ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="bolt" className="w-4 h-4" />}
            {backing ? L({ ar: "جارٍ النسخ…", en: "Backing up…" }) : L({ ar: "نسخ الآن", en: "Backup now" })}
          </button>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="font-bold text-snow">{L({ ar: "التخزين (صور وملفات)", en: "Storage (photos & files)" })}</span>
            <span className="font-display text-moss"><b className="text-snow">62</b> / 100 GB</span>
          </div>
          <Meter pct={62} color="#45D6C0" />
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="edit" title={L({ ar: "تصدير البيانات", en: "Export data" })} sub={L({ ar: "ملفات CSV جاهزة لـ Excel — بترميز عربي صحيح", en: "Excel-ready CSV files with proper Arabic encoding" })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => { downloadCsv([[L({ ar: "الاسم", en: "Name" }), L({ ar: "العضوية", en: "Membership" }), L({ ar: "تنتهي", en: "Expires" }), L({ ar: "الوزن", en: "Weight" }), L({ ar: "الالتزام %", en: "Adherence %" })], ...CLIENTS.map((c) => [c.name, MEMBERSHIP_LABEL[c.membership], c.membershipEnd, c.weight, c.adherence])], "fitpro-members.csv"); toast(L({ ar: "نُزّل ملف الأعضاء (CSV) ✓", en: "Members CSV downloaded ✓" }), "mint"); }}
            className="btn-ghost rounded-xl p-4 text-right group"
          >
            <div className="text-xs font-bold text-snow group-hover:text-[var(--brand)] transition-colors">{L({ ar: "سجل الأعضاء", en: "Members list" })}</div>
            <div className="text-[10px] text-moss mt-1">{CLIENTS.length} {L({ ar: "عضو · الاسم، العضوية، الوزن، الالتزام", en: "members · name, plan, weight, adherence" })}</div>
          </button>
          <button
            onClick={() => { downloadCsv([[L({ ar: "الأسبوع", en: "Week" }), L({ ar: "الوزن كغ", en: "Weight kg" })], ...WEIGHT_SERIES.map((w, i) => [`${i + 1}`, w])], "fitpro-progress.csv"); toast(L({ ar: "نُزّل سجل التقدم (CSV) ✓", en: "Progress CSV downloaded ✓" }), "mint"); }}
            className="btn-ghost rounded-xl p-4 text-right group"
          >
            <div className="text-xs font-bold text-snow group-hover:text-[var(--brand)] transition-colors">{L({ ar: "سجل تقدم الأوزان", en: "Weight progress log" })}</div>
            <div className="text-[10px] text-moss mt-1">12 {L({ ar: "أسبوعاً · قياسات الأسبوع", en: "weeks · weekly measurements" })}</div>
          </button>
        </div>
      </div>
      <div className="rounded-[calc(var(--radius)*1px)] border border-blush/35 bg-blush/5 p-5">
        <SectionTitle icon="trash" title={L({ ar: "منطقة الخطر", en: "Danger zone" })} sub={L({ ar: "إجراءات لا يمكن التراجع عنها", en: "Actions that cannot be undone" })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="chip rounded-xl p-4 !border-blush/25">
            <div className="text-xs font-bold text-snow">{L({ ar: "حذف صور التقدم", en: "Delete progress photos" })}</div>
            <div className="text-[10px] text-moss mt-1 mb-3">{L({ ar: "اكتب «حذف» للتأكيد", en: "Type DELETE to confirm" })}</div>
            <div className="flex gap-2">
              <input value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} placeholder={L({ ar: "حذف", en: "DELETE" })} className={`${inputCls} flex-1 !border-blush/30`} />
              <button
                onClick={() => { toast(L({ ar: "حُذفت 1,204 صور وأُشعر الأعضاء حسب السياسة", en: "1,204 photos deleted — members notified per policy" }), "blush"); setConfirmDel(""); }}
                disabled={confirmDel !== L({ ar: "حذف", en: "DELETE" })}
                className="rounded-xl px-4 py-2 text-[10px] font-bold bg-blush/15 border border-blush/40 text-blush disabled:opacity-40 transition-all hover:bg-blush/25"
              >
                {L({ ar: "حذف نهائي", en: "Delete" })}
              </button>
            </div>
          </div>
          <div className="chip rounded-xl p-4 !border-blush/25">
            <div className="text-xs font-bold text-snow">{L({ ar: "نقل ملكية الصالة", en: "Transfer gym ownership" })}</div>
            <div className="text-[10px] text-moss mt-1 mb-3">{L({ ar: "لمدير آخر أو لمنصة FitPro", en: "To another admin or back to FitPro" })}</div>
            <button onClick={() => toast(L({ ar: "أُرسل طلب النقل — يتطلب موافقة الطرف الآخر", en: "Transfer requested — pending recipient approval" }), "ember")} className="rounded-xl px-4 py-2 text-[10px] font-bold bg-ember/15 border border-ember/40 text-ember transition-all hover:bg-ember/25">
              {L({ ar: "بدء النقل", en: "Start transfer" })}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function IdentitySection() {
  const { L } = { L: (o: { ar: string; en: string }) => o.ar };
  const [data, setData] = useState<MyAppearance | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { fetchMyAppearance().then(setData).catch(() => setErr(true)); }, []);
  if (err) return <div className="glass p-6 text-xs text-blush">{"\u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u2014 \u064a\u062a\u0637\u0644\u0628 \u062f\u0648\u0631 \u0645\u062f\u064a\u0631 \u0627\u0644\u0635\u0627\u0644\u0629"}</div>;
  if (!data) return <div className="glass p-6 text-xs text-moss">{"\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026"}</div>;
  return (
    <div className="glass p-5">
      <div className="font-display font-bold text-sm text-snow mb-1">{"\u0627\u0644\u0647\u0648\u064a\u0629 \u0627\u0644\u0628\u0635\u0631\u064a\u0629"}</div>
      <div className="text-[10px] text-moss mb-4">{"3 \u0623\u0644\u0648\u0627\u0646 \u00b7 \u0627\u0644\u0648\u0636\u0639 \u00b7 \u0627\u0644\u0634\u0639\u0627\u0631 \u00b7 \u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u00b7 \u0627\u0644\u0628\u0627\u0646\u0631 \u00b7 \u0634\u0627\u0634\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u2014 \u064a\u0637\u0628\u0642 \u0639\u0644\u0649 \u062a\u0637\u0628\u064a\u0642\u0643 \u0641\u0648\u0631\u064b\u0627"}</div>
      <AppearanceEditor
        initial={{
          primary_color: data.primary_color, accent_color: data.accent_color,
          background_color: data.background_color, default_theme: data.default_theme,
          font_family: "Cairo", splash_title: data.splash_title, splash_tagline: data.splash_tagline,
          splash_style: data.splash_style, logo: data.logo, banner: data.banner,
          background_image: data.background_image, splash_image: data.splash_image,
        }}
        onSave={async (patch) => {
          await updateMyAppearance(patch);
          setTimeout(() => window.location.reload(), 700);
        }}
      />
    </div>
  );
}

function SettingsCenter() {
  const L = useL();
  const [sec, setSec] = useState("general");
  const SECTIONS: { id: string; icon: IconName; ar: string; en: string }[] = [
    { id: "identity", icon: "palette", ar: "الهوية البصرية", en: "Branding" },
        { id: "general", icon: "settings", ar: "عام", en: "General" },
    { id: "plans", icon: "star", ar: "العضويات والأسعار", en: "Plans & Pricing" },
    { id: "notif", icon: "bell", ar: "الإشعارات", en: "Notifications" },
    { id: "security", icon: "shield", ar: "الأمان والجلسات", en: "Security" },
    { id: "payments", icon: "chart", ar: "الدفع والفوترة", en: "Payments" },
    { id: "api", icon: "bolt", ar: "التكاملات و API", en: "API & Integrations" },
    { id: "data", icon: "layers", ar: "البيانات والنسخ", en: "Data & Backup" },
  ];
  return (
    <div className="grid lg:grid-cols-[230px_1fr] gap-5 items-start">
      <Reveal>
        <div className="glass p-2 lg:sticky lg:top-4 flex lg:flex-col gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSec(s.id)}
              className={`nav-item shrink-0 lg:w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[11px] font-bold whitespace-nowrap ${sec === s.id ? "nav-active" : "text-moss"}`}
            >
              <Icon name={s.icon} className="w-4 h-4" /> {L(s)}
            </button>
          ))}
        
          <div className="mt-auto pt-3 border-t border-[var(--glass-border)] px-2 flex items-center justify-between text-[11px] text-moss">
            <span>اللغة / Language</span>
            <LangToggle compact />
          </div>
        </div>
      </Reveal>
      <div key={sec} className="anim-fade-up grid gap-5 min-w-0 content-start">
        {sec === "identity" && <IdentitySection />}
        {sec === "general" && <GeneralSection />}
        {sec === "plans" && <PlansSection />}
        {sec === "notif" && <NotifSection />}
        {sec === "security" && <SecuritySection />}
        {sec === "payments" && <PaymentsSection />}
        {sec === "api" && <ApiSection />}
        {sec === "data" && <DataSection />}
      </div>
    </div>
  );
}

export default function GymAdmin({ tab }: { tab: string }) {
  if (tab === "trainers") return <Trainers />;
  if (tab === "members") return <Members />;
  if (tab === "branding") return <BrandingStudio />;
  if (tab === "devices") return <Devices />;
  if (tab === "settings") return <SettingsCenter />;
  return <Overview />;
}
