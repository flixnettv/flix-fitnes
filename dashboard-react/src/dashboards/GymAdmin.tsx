import React, { useRef, useState } from "react";
import { CLIENTS, GOAL_MIX, MEMBERSHIP_LABEL, SESSIONS_WEEK, TRAINERS, fmt, money } from "../data";
import { BODY_FONTS, DISPLAY_FONTS, Lang } from "../i18n";
import { useApp } from "../store";
import { Avatar, Badge, Bars, Donut, Icon, IconName, Meter, Reveal, SectionTitle, Stars, useCountUp } from "../components/ui";

/* ================= overview ================= */
function Overview() {
  const { gym, t } = useApp();
  const sessions = useCountUp(SESSIONS_WEEK.reduce((s, d) => s + d.v, 0), 1300);
  const kpis = [
    { icon: "users" as IconName, label: t("kpi.members"), v: fmt(gym.members), d: `▲ ${gym.growth}%`, up: true },
    { icon: "dumbbell" as IconName, label: t("kpi.trainers"), v: String(gym.trainersCount), d: "▲ 2", up: true },
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
          <div className="flex-1 min-w-[220px] text-xs text-moss">{TRAINERS.length} مدرباً · متوسط التقييم <b className="text-[var(--brand)] font-display">4.8 ★</b></div>
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

function UploadField({ labelKey, hintKey, field, value }: { labelKey: string; hintKey: string; field: "logoUrl" | "bannerUrl" | "bgUrl"; value: string | null }) {
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
            <div className="glass p-5 grid sm:grid-cols-3 gap-4">
              <UploadField labelKey="brand.logo" hintKey="brand.logoHint" field="logoUrl" value={brand.logoUrl} />
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
              </div>
              <div className="p-4 space-y-2.5">
                <div className="rounded-xl p-3 border" style={{ background: `color-mix(in srgb, ${brand.accent} 12%, transparent)`, borderColor: `color-mix(in srgb, ${brand.accent} 35%, transparent)`, borderRadius: brand.radius }}>
                  <div className="text-[10px] font-bold" style={{ color: brand.accent }}>{t("login.todayWorkout")}</div>
                  <div className="font-display font-bold text-snow text-xs mt-0.5">{t("login.pushDay")}</div>
                </div>
                <div className="flex gap-2">
                  <span className="btn-brand rounded-xl px-3 py-2 text-[10px] font-bold flex-1 text-center" style={{ borderRadius: brand.radius }}>{t("client.startWorkout")}</span>
                  <span className="btn-ghost rounded-xl px-3 py-2 text-[10px] font-bold text-moss" style={{ borderRadius: brand.radius }}>{t("nav.progress")}</span>
                </div>
                <div className="flex items-center justify-between chip rounded-xl px-3 py-2" style={{ borderRadius: brand.radius }}>
                  <span className="text-[10px] text-moss" style={{ fontFamily: `"${brand.fontBody}"` }}>{t("client.water")}</span>
                  <span className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i < 3 ? brand.accent2 : "var(--color-line2)" }} />)}
                  </span>
                </div>
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

/* ================= settings ================= */
function Settings() {
  const { toast, t, gym } = useApp();
  const [features, setFeatures] = useState({ nutrition: true, photos: true, chat: false, payments: true, wearables: true });
  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0" style={{ background: on ? "var(--brand)" : "var(--color-line2)" }} aria-label="toggle">
      <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-[var(--color-bg)] shadow transition-all duration-300" style={{ insetInlineStart: on ? "calc(100% - 21px)" : "3px" }} />
    </button>
  );
  const rows: { k: string; d: string; key: keyof typeof features }[] = [
    { k: "خطط التغذية", d: "السماح للمدربين ببناء وإسناد خطط تغذية", key: "nutrition" },
    { k: "صور التقدم", d: "رفع الأعضاء صور تقدم خاصة بالمدرب", key: "photos" },
    { k: "محادثة داخلية", d: "قناة تواصل بين المدرب وأعضائه", key: "chat" },
    { k: "الدفع والاشتراكات", d: "تجديد العضويات من التطبيق (Moyasar)", key: "payments" },
    { k: "الأجهزة القابلة للارتداء", d: "ربط الساعات والموازين الذكية بالحسابات", key: "wearables" },
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Reveal>
        <div className="glass p-5">
          <SectionTitle icon="settings" title="ميزات الصالة" sub={`حسب باقة «${gym.plan}» — فعّل ما يناسب علامتك`} />
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.key} className="chip rounded-xl p-3.5 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs font-bold text-snow">{r.k}</div>
                  <div className="text-[10px] text-moss mt-0.5">{r.d}</div>
                </div>
                <Toggle on={features[r.key]} onClick={() => { const next = !features[r.key]; setFeatures((f) => ({ ...f, [r.key]: next })); toast(`${r.k} — ${next ? "مفعّل" : "معطّل"}`, next ? "mint" : "ember"); }} />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div className="glass p-5">
          <SectionTitle icon="shield" title="حدود الباقة" sub={`${gym.plan} — ${gym.nameAr}`} />
          <div className="space-y-4">
            {[
              ["الأعضاء", gym.members, 2000, "var(--brand)"],
              ["المدربون", gym.trainersCount, gym.plan === "مؤسسي" ? 50 : 20, "#FF8A3C"],
              ["التخزين (صور التقدم)", 62, 100, "#45D6C0"],
            ].map(([k, v, max, c]) => (
              <div key={k as string}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-snow">{k}</span>
                  <span className="font-display text-moss"><b className="text-snow">{fmt(v as number)}</b> / {fmt(max as number)}</span>
                </div>
                <Meter pct={((v as number) / (max as number)) * 100} color={c as string} />
              </div>
            ))}
          </div>
          <div className="mt-5 p-3.5 rounded-xl border border-dashed border-[var(--glass-border)] text-[11px] text-moss leading-5">
            {t("brand.adminOnly")}
          </div>
          <button onClick={() => toast("حُفظت الإعدادات وطُبّقت على تطبيق الأعضاء فوراً", "brand")} className="btn-brand rounded-xl px-5 py-2.5 text-xs font-bold mt-4 flex items-center gap-2">
            <Icon name="check" className="w-4 h-4" /> حفظ الإعدادات
          </button>
        </div>
      </Reveal>
    </div>
  );
}

export default function GymAdmin({ tab }: { tab: string }) {
  if (tab === "trainers") return <Trainers />;
  if (tab === "members") return <Members />;
  if (tab === "branding") return <BrandingStudio />;
  if (tab === "devices") return <Devices />;
  if (tab === "settings") return <Settings />;
  return <Overview />;
}
