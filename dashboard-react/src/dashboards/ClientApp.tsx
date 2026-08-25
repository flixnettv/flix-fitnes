import { useEffect, useMemo, useState } from "react";
import { EXERCISES, FOODS, GOALS, MEAL_TEMPLATE, WEIGHT_SERIES, WORKOUT_TEMPLATE } from "../data";
import { useApp } from "../store";
import { AreaChart, Badge, Icon, Meter, Reveal, Ring, SectionTitle } from "../components/ui";

export interface ClientState {
  done: number[];
  loggedMeals: number[];
  water: number;
  device: string | null;
  pairing: string | null;
  bpm: number;
  steps: number;
  scaleLog: { w: number; fat: number; at: string }[];
}

type SetState = (fn: (p: ClientState) => ClientState) => void;

/* ================= home ================= */
function HomeTab({ s, setS }: { s: ClientState; setS: SetState }) {
  const { brand, toast, t } = useApp();
  const today = WORKOUT_TEMPLATE.days[0];
  const pct = Math.round((s.done.length / today.exercises.length) * 100);

  const consumed = useMemo(() => {
    let cal = 0, protein = 0, carbs = 0, fat = 0;
    s.loggedMeals.forEach((mi) => MEAL_TEMPLATE.meals[mi].items.forEach((it) => {
      const f = FOODS.find((x) => x.id === it.foodId)!;
      const k = it.grams / 100;
      cal += f.cal * k; protein += f.protein * k; carbs += f.carbs * k; fat += f.fat * k;
    }));
    return { cal: Math.round(cal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
  }, [s.loggedMeals]);

  const tM = MEAL_TEMPLATE.targets;
  const lastScale = s.scaleLog[0];

  const toggleEx = (idx: number) => {
    const on = s.done.includes(idx);
    setS((p) => ({ ...p, done: on ? p.done.filter((i) => i !== idx) : [...p.done, idx] }));
    if (!on && s.done.length + 1 === today.exercises.length) toast("أنهيت تمرين اليوم كاملاً 🔥 +50 نقطة", "brand");
  };

  return (
    <div className="grid gap-5">
      {/* hero */}
      <Reveal>
        <div className="glass overflow-hidden relative sheen">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(600px 200px at 15% 0%, color-mix(in srgb, ${brand.accent} 14%, transparent), transparent 70%)` }} />
          {brand.bannerUrl && <img src={brand.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12]" />}
          <div className="p-5 flex flex-wrap items-center gap-5 relative">
            <div className="flex-1 min-w-[230px]">
              <div className="text-[11px] text-moss">{t("client.weekOf")} · الأربعاء</div>
              <h2 className="font-display font-extrabold text-2xl text-snow mt-1">{t("client.hi")} <span className="inline-block animate-bounce">💪</span></h2>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <Badge tone="brand">🔥 {t("client.streak")}</Badge>
                <Badge tone="ember">عضوية VIP</Badge>
                {s.device && <Badge tone="mint">⌚ {t("client.connected")}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <Ring pct={pct} size={94} thickness={9} label={`${pct}%`} subLabel={t("client.today")} />
              <div className="grid gap-2 text-center">
                <div className="chip rounded-xl px-4 py-2">
                  <div className="font-display font-bold text-lg text-snow" dir="ltr">{s.steps.toLocaleString()}</div>
                  <div className="text-[9px] text-moss">{t("client.steps")}{s.device ? " · ⌚" : ""}</div>
                </div>
                <div className="chip rounded-xl px-4 py-2">
                  <div className="font-display font-bold text-lg" style={{ color: brand.accent }}>{consumed.cal}</div>
                  <div className="text-[9px] text-moss">{t("client.kcal")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* today workout */}
        <Reveal delay={80}>
          <div className="glass p-5">
            <SectionTitle
              icon="dumbbell" title={`${t("client.today")} — ${today.focus}`} sub={`${today.exercises.length} تمارين · ~55 دقيقة · كابتن فهد`}
              action={pct === 100 ? <Badge tone="mint">{t("client.doneAll")} ✓</Badge> : <Badge tone="ember">{today.exercises.length - s.done.length} {t("client.remaining")}</Badge>}
            />
            <div className="space-y-2">
              {today.exercises.map((ex, idx) => {
                const info = EXERCISES.find((e) => e.id === ex.exId)!;
                const on = s.done.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleEx(idx)}
                    className={`w-full text-start rounded-xl border px-3.5 py-3 flex items-center gap-3 transition-all duration-300 ${on ? "bg-[var(--brand-soft)] border-[var(--brand-line)]" : "chip hover:border-[var(--brand-line)]"}`}
                  >
                    <span className={`w-6 h-6 rounded-lg grid place-items-center border transition-all duration-300 shrink-0 ${on ? "bg-[var(--brand)] border-transparent text-[#0b110d] scale-110" : "border-[var(--color-line2)] text-transparent"}`}>
                      <Icon name="check" className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-xs font-bold truncate ${on ? "text-[var(--brand)] line-through" : "text-snow"}`}>{info.nameAr}</span>
                      <span className="block text-[9px] text-moss2 mt-0.5">{info.muscle} · {ex.sets} × {ex.reps} · {t("client.rest")} {ex.rest}ث</span>
                    </span>
                    {on && <Icon name="bolt" className="w-4 h-4 text-[var(--brand)] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div className="grid gap-5 content-start">
          {/* live vitals from wearable */}
          {s.device && (
            <Reveal delay={120}>
              <div className="glass p-5 relative overflow-hidden">
                <div className="absolute -top-12 -end-12 w-36 h-36 rounded-full blur-2xl opacity-25" style={{ background: "var(--brand)" }} />
                <div className="flex items-center justify-between mb-3 relative">
                  <span className="flex items-center gap-2 text-xs font-bold text-snow"><span className="anim-heart inline-flex text-blush"><Icon name="heart" className="w-4 h-4" /></span> النبض المباشر</span>
                  <Badge tone="brand">⌚ {s.device}</Badge>
                </div>
                <div className="flex items-end gap-2 relative">
                  <span className="font-display font-extrabold text-4xl text-snow" dir="ltr">{s.bpm || "—"}</span>
                  <span className="text-[10px] text-moss mb-1.5">{t("client.bpm")}</span>
                </div>
                <svg viewBox="0 0 300 60" className="w-full mt-2 h-12" aria-hidden="true">
                  <path d="M0 30 H60 L70 30 78 12 88 48 96 22 104 30 H150 L160 30 168 8 178 52 186 24 194 30 H240 L250 30 258 14 268 46 276 26 284 30 H300" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" className="ecg-path" />
                </svg>
              </div>
            </Reveal>
          )}
          {/* macros */}
          <Reveal delay={140}>
            <div className="glass p-5">
              <SectionTitle icon="apple" title={t("client.macros")} sub={t("client.loggedFrom")} />
              <div className="flex justify-around mb-4">
                <Ring pct={(consumed.protein / tM.protein) * 100} size={70} thickness={7} label={`${consumed.protein}غ`} subLabel={t("login.protein")} />
                <Ring pct={(consumed.carbs / tM.carbs) * 100} size={70} thickness={7} label={`${consumed.carbs}غ`} subLabel={t("login.carbs")} color="#FF8A3C" />
                <Ring pct={(consumed.fat / tM.fat) * 100} size={70} thickness={7} label={`${consumed.fat}غ`} subLabel={t("login.fat")} color="#45D6C0" />
              </div>
              <Meter pct={(consumed.cal / tM.cal) * 100} />
              <div className="flex justify-between text-[10px] text-moss mt-1.5">
                <span>السعرات: <b className="text-snow">{consumed.cal}</b></span>
                <span>الهدف: <b className="text-snow">{tM.cal}</b></span>
              </div>
            </div>
          </Reveal>
          {/* water + scale */}
          <Reveal delay={200}>
            <div className="glass p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-bold text-snow"><Icon name="drop" className="w-4 h-4 text-sky2" /> {t("client.water")}</span>
                <span className="font-display font-bold text-sm text-sky2" dir="ltr">{(s.water * 0.25).toFixed(2)} / 2L</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 8 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setS((p) => ({ ...p, water: p.water === i + 1 ? i : i + 1 }))}
                    className={`w-9 h-11 rounded-lg border grid place-items-center transition-all duration-300 ${i < s.water ? "bg-sky2/20 border-sky2/60 text-sky2 -translate-y-0.5" : "chip text-[var(--color-line2)] hover:text-sky2"}`}
                    aria-label="cup"
                  >
                    <Icon name="drop" className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setS((p) => ({ ...p, water: Math.min(8, p.water + 1) })); toast("أُضيف كوب ماء 250مل 💧", "mint"); }} className="btn-ghost rounded-xl flex-1 py-2 text-[11px] font-bold text-moss flex items-center justify-center gap-2">
                  <Icon name="plus" className="w-3.5 h-3.5" /> {t("client.cup")}
                </button>
              </div>
              {lastScale && (
                <div className="mt-3 chip rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-moss">⚖️ آخر وزن من الميزان</span>
                  <span className="font-display font-bold text-sm text-[var(--brand)]" dir="ltr">{lastScale.w} kg</span>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/* ================= workouts ================= */
function WorkoutsTab() {
  const { toast, t, brand } = useApp();
  const [day, setDay] = useState(0);
  const d = WORKOUT_TEMPLATE.days[day];
  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass p-5">
          <SectionTitle icon="calendar" title={t("client.weekPlan")} sub={`${WORKOUT_TEMPLATE.name} · ${WORKOUT_TEMPLATE.level} · كابتن فهد العتيبي`} />
          <div className="flex gap-2 flex-wrap">
            {WORKOUT_TEMPLATE.days.map((dd, i) => (
              <button key={i} onClick={() => setDay(i)} className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${i === day ? "tab-active" : "border-[var(--glass-border)] text-moss hover:text-snow"}`}>
                <span className="font-display">{dd.name}</span>
                <span className="text-[9px] opacity-70">{dd.exercises.length}</span>
              </button>
            ))}
            <span className="px-4 py-2.5 rounded-xl border border-dashed border-[var(--glass-border)] text-xs text-moss2">الخميس — راحة نشطة 🚶</span>
            <span className="px-4 py-2.5 rounded-xl border border-dashed border-[var(--glass-border)] text-xs text-moss2">الجمعة — راحة 😴</span>
          </div>
        </div>
      </Reveal>
      <Reveal delay={90}>
        <div className="glass p-5 relative overflow-hidden">
          {brand.bannerUrl && <img src={brand.bannerUrl} alt="" className="absolute inset-x-0 top-0 h-24 w-full object-cover opacity-[0.08] pointer-events-none" />}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 relative">
            <div>
              <div className="font-display font-bold text-lg text-snow">{d.focus}</div>
              <div className="text-[11px] text-moss mt-0.5">{d.exercises.length} تمارين · {d.exercises.reduce((s, e) => s + e.sets, 0)} مجموعة · ~55 دقيقة</div>
            </div>
            <button onClick={() => toast("بدأ المؤقت — سجّل أوزانك أثناء التمرين وسيتحدث سجلك تلقائياً", "brand")} className="btn-brand rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2">
              <Icon name="bolt" className="w-4 h-4" /> {t("client.startWorkout")}
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3 relative">
            {d.exercises.map((ex, i) => {
              const info = EXERCISES.find((e) => e.id === ex.exId)!;
              return (
                <div key={i} className="glass panel-hover p-4 anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-snow">{i + 1}. {info.nameAr}</span>
                    <Badge tone={info.difficulty === "متقدم" ? "blush" : info.difficulty === "متوسط" ? "ember" : "mint"}>{info.difficulty}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    {[["مجموعات", String(ex.sets)], ["تكرار", ex.reps], [t("client.rest"), `${ex.rest}ث`]].map(([k, v]) => (
                      <div key={k} className="chip rounded-lg py-1.5">
                        <div className="text-[9px] text-moss2">{k}</div>
                        <div className="font-display font-bold text-[13px] text-[var(--brand)] mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-moss2 mt-2" dir="ltr">{info.nameEn} · {info.equipment}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ================= nutrition ================= */
function NutritionTab({ s, setS }: { s: ClientState; setS: SetState }) {
  const { toast, t } = useApp();
  const mealKcal = (mi: number) =>
    Math.round(MEAL_TEMPLATE.meals[mi].items.reduce((sum, it) => {
      const f = FOODS.find((x) => x.id === it.foodId)!;
      return sum + f.cal * (it.grams / 100);
    }, 0));
  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass p-5">
          <SectionTitle icon="food" title={t("client.meals")} sub={`${MEAL_TEMPLATE.name} · هدف ${MEAL_TEMPLATE.targets.cal} سعرة`} action={<Badge tone="brand">{s.loggedMeals.length}/{MEAL_TEMPLATE.meals.length}</Badge>} />
        </div>
      </Reveal>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MEAL_TEMPLATE.meals.map((m, mi) => {
          const logged = s.loggedMeals.includes(mi);
          return (
            <Reveal key={m.name} delay={mi * 70}>
              <div className={`glass p-4 h-full flex flex-col transition-all duration-300 ${logged ? "!border-mint/50" : "panel-hover"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-bold text-snow">{m.name}</div>
                    <div className="text-[10px] text-moss2 mt-0.5" dir="ltr">{m.time} · {mealKcal(mi)} kcal</div>
                  </div>
                  {logged ? <Badge tone="mint">✓</Badge> : <Badge tone="moss">قادمة</Badge>}
                </div>
                <div className="space-y-1.5 flex-1">
                  {m.items.map((it, ii) => {
                    const f = FOODS.find((x) => x.id === it.foodId)!;
                    return (
                      <div key={ii} className="flex items-center justify-between text-[11px] chip rounded-lg px-2.5 py-1.5">
                        <span className="text-snow/90">{f.nameAr}</span>
                        <span className="text-moss font-display">{it.grams}غ</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    if (logged) { setS((p) => ({ ...p, loggedMeals: p.loggedMeals.filter((x) => x !== mi) })); toast(`أُلغي تسجيل «${m.name}»`, "ember"); }
                    else { setS((p) => ({ ...p, loggedMeals: [...p.loggedMeals, mi] })); toast(`سُجّلت «${m.name}» — تحدّثت الماكروز (+${mealKcal(mi)} سعرة)`, "mint"); }
                  }}
                  className={`mt-3 rounded-xl py-2.5 text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${logged ? "btn-ghost text-moss" : "btn-brand"}`}
                >
                  <Icon name={logged ? "minus" : "check"} className="w-4 h-4" />
                  {logged ? t("client.unlogMeal") : t("client.logMeal")}
                </button>
              </div>
            </Reveal>
          );
        })}
        <Reveal delay={380}>
          <button onClick={() => toast("فُتح الماسح — وجّه الكاميرا نحو باركود المنتج", "brand")} className="w-full h-full min-h-[170px] border border-dashed border-[var(--glass-border)] rounded-2xl grid place-items-center text-moss hover:text-[var(--brand)] hover:border-[var(--brand-line)] transition-colors group">
            <span className="text-center">
              <Icon name="camera" className="w-7 h-7 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold block">{t("client.scan")}</span>
              <span className="text-[10px] text-moss2 block mt-1">500+ طعام محلي في القاعدة</span>
            </span>
          </button>
        </Reveal>
      </div>
    </div>
  );
}

/* ================= devices & scale ================= */
const WATCHES = [
  { id: "Apple Watch Ultra", icon: "clock", brand: "Apple Health", color: "#F4727F" },
  { id: "Garmin Venu 3", icon: "bolt", brand: "Garmin Connect", color: "#45D6C0" },
  { id: "Fitbit Charge 6", icon: "heart", brand: "Fitbit API", color: "#7FB4FF" },
] as const;

function DevicesTab({ s, setS }: { s: ClientState; setS: SetState }) {
  const { toast, t } = useApp();
  const [scaleSyncing, setScaleSyncing] = useState(false);

  /* live stream while paired */
  useEffect(() => {
    if (!s.device) return;
    const id = window.setInterval(() => {
      setS((p) => ({ ...p, bpm: 62 + Math.round(Math.random() * 34), steps: p.steps + 35 + Math.round(Math.random() * 90) }));
    }, 2200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.device]);

  const pair = (name: string) => {
    setS((p) => ({ ...p, pairing: name }));
    window.setTimeout(() => {
      setS((p) => ({ ...p, device: name, pairing: null, bpm: 74 }));
      toast(`${t("toast.paired")} — ${name}`, "mint");
    }, 1500);
  };
  const unpair = () => {
    setS((p) => ({ ...p, device: null, bpm: 0 }));
    toast(t("toast.unpaired"), "ember");
  };

  const syncScale = () => {
    setScaleSyncing(true);
    window.setTimeout(() => {
      const last = s.scaleLog[0]?.w ?? 86.2;
      const w = Math.round((last - 0.1 - Math.random() * 0.3) * 10) / 10;
      const fat = Math.round((17.6 - Math.random() * 0.4) * 10) / 10;
      const at = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
      setS((p) => ({ ...p, scaleLog: [{ w, fat, at }, ...p.scaleLog].slice(0, 6) }));
      setScaleSyncing(false);
      toast(`${t("toast.scaleSynced")} — ${w} كغ · دهون ${fat}%`, "brand");
    }, 1400);
  };

  return (
    <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5">
      {/* wearables */}
      <Reveal>
        <div className="glass p-5">
          <SectionTitle icon="heart" title={t("client.wearables")} sub={t("client.wearSub")} action={s.device ? <Badge tone="mint">⌚ {s.device}</Badge> : <Badge tone="moss">Bluetooth جاهز</Badge>} />
          <div className="space-y-3">
            {WATCHES.map((wch, i) => {
              const connected = s.device === wch.id;
              const pairing = s.pairing === wch.id;
              const disabled = !!s.device && !connected;
              return (
                <div key={wch.id} className={`glass p-4 flex items-center gap-3.5 transition-all duration-300 anim-fade-up ${connected ? "!border-[var(--brand-line)]" : disabled ? "opacity-45" : "panel-hover"}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="relative w-12 h-12 rounded-2xl grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${wch.color} 12%, transparent)`, color: wch.color, border: `1px solid color-mix(in srgb, ${wch.color} 35%, transparent)` }}>
                    <Icon name={wch.icon as never} className="w-6 h-6" />
                    {connected && <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-mint border-2 border-[var(--color-panel)] live-dot" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-snow">{wch.id}</div>
                    <div className="text-[10px] text-moss2 mt-0.5" dir="ltr">{wch.brand}</div>
                    {connected && (
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        <span className="flex items-center gap-1 text-blush font-bold"><Icon name="heart" className="w-3 h-3 anim-heart" /> <span dir="ltr">{s.bpm || "…"}</span> {t("client.bpm")}</span>
                        <span className="text-moss">👟 <span dir="ltr" className="font-display font-bold text-snow">{s.steps.toLocaleString()}</span></span>
                      </div>
                    )}
                  </div>
                  {connected ? (
                    <button onClick={unpair} className="btn-ghost rounded-xl px-3.5 py-2 text-[10px] font-bold text-moss hover:text-blush">{t("client.disconnect")}</button>
                  ) : pairing ? (
                    <span className="flex items-center gap-2 text-[10px] font-bold text-[var(--brand)]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                      {t("client.pairing")}
                    </span>
                  ) : (
                    <button onClick={() => pair(wch.id)} disabled={disabled} className="btn-brand rounded-xl px-4 py-2 text-[10px] font-bold">{t("client.connect")}</button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3.5 rounded-xl border border-dashed border-[var(--glass-border)] text-[10px] text-moss leading-5">
            يُزامَن النبض كل دقيقتين والخطوات لحظياً عبر Bluetooth LE — البيانات تُستخدم لتعديل شدة تمارينك تلقائياً.
          </div>
        </div>
      </Reveal>

      <div className="grid gap-5 content-start">
        {/* scale */}
        <Reveal delay={100}>
          <div className="glass p-5 relative overflow-hidden">
            <div className="absolute -top-14 -start-14 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--brand)" }} />
            <div className="flex items-center gap-3.5 relative">
              <span className="w-12 h-12 rounded-2xl grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] shrink-0">
                <Icon name="target" className="w-6 h-6" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-snow font-display">{t("client.scale")}</div>
                <div className="text-[10px] text-moss2" dir="ltr">Omron HBF-255T · Bluetooth</div>
              </div>
              <Badge tone="mint">{t("dev.online")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 relative">
              <div className="chip rounded-xl p-3 text-center">
                <div className="text-[9px] text-moss2">الوزن</div>
                <div className="font-display font-extrabold text-xl text-snow mt-0.5" dir="ltr">{s.scaleLog[0]?.w ?? "86.2"}<span className="text-[10px] text-moss"> kg</span></div>
              </div>
              <div className="chip rounded-xl p-3 text-center">
                <div className="text-[9px] text-moss2">نسبة الدهون</div>
                <div className="font-display font-extrabold text-xl text-ember mt-0.5" dir="ltr">{s.scaleLog[0]?.fat ?? "17.8"}<span className="text-[10px] text-moss"> %</span></div>
              </div>
            </div>
            <button onClick={syncScale} disabled={scaleSyncing} className="btn-brand w-full rounded-xl py-3 mt-4 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-75 relative">
              {scaleSyncing ? (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg>{t("dev.syncing")}</>) : (<><Icon name="bolt" className="w-4 h-4" />{t("client.scaleSync")}</>)}
            </button>
            <p className="text-[9px] text-moss2 mt-2.5 text-center">قف على الميزان ثم اضغط مزامنة — يُحدّث وزنك في كل التقارير والتسجيل الأسبوعي</p>
          </div>
        </Reveal>

        {/* sync log */}
        <Reveal delay={160}>
          <div className="glass p-5">
            <SectionTitle icon="clock" title={t("client.syncLog")} sub="آخر عمليات المزامنة" />
            {s.scaleLog.length === 0 && !s.device ? (
              <div className="border border-dashed border-[var(--glass-border)] rounded-xl p-6 text-center text-[11px] text-moss2">
                لا مزامنات بعد — اربط ساعة أوزامن الميزان لتظهر البيانات هنا
              </div>
            ) : (
              <div className="space-y-2">
                {s.device && (
                  <div className="chip rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-mint live-dot" />
                    <span className="text-[11px] text-snow flex-1">⌚ {s.device} — تدفق مستمر (نبض + خطوات)</span>
                    <span className="text-[9px] text-moss2">الآن</span>
                  </div>
                )}
                {s.scaleLog.map((l, i) => (
                  <div key={i} className="chip rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                    <span className="text-[11px] text-snow flex-1">⚖️ وزن <b className="font-display" dir="ltr">{l.w}kg</b> · دهون <b className="font-display" dir="ltr">{l.fat}%</b></span>
                    <span className="text-[9px] text-moss2">{l.at}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ================= progress ================= */
function ProgressTab({ s }: { s: ClientState }) {
  const { toast, t } = useApp();
  const stats = [
    { k: "الوزن", to: s.scaleLog[0]?.w?.toString() ?? "86.2", from: "91.5", unit: "كغ" },
    { k: "نسبة الدهون", to: s.scaleLog[0]?.fat?.toString() ?? "17.8", from: "22.4", unit: "%" },
    { k: "الكتلة العضلية", to: "36.8", from: "34.1", unit: "كغ" },
    { k: "محيط الخصر", to: "91", from: "98", unit: "سم" },
    { k: "سكوات 1RM", to: "122.5", from: "95", unit: "كغ" },
    { k: "محيط الذراع", to: "38.5", from: "36", unit: "سم" },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <Reveal>
          <div className="glass p-5">
            <SectionTitle icon="chart" title="رحلة الوزن" sub="12 أسبوع من الالتزام" action={<Badge tone="mint">▼ 5.3 كغ</Badge>} />
            <AreaChart data={WEIGHT_SERIES} labels={["أ1", "أ2", "أ3", "أ4", "أ5", "أ6", "أ7", "أ8", "أ9", "أ10", "أ11", "أ12"]} h={210} />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="glass p-5 h-full flex flex-col">
            <SectionTitle icon="camera" title={t("client.photos")} sub={t("client.photosSub")} />
            <div className="grid grid-cols-2 gap-3 flex-1">
              {["أمامي", "جانبي", "خلفي", "قياسات"].map((x, i) => (
                <button key={x} className="chip rounded-xl border-dashed border grid place-items-center min-h-[90px] text-moss hover:text-[var(--brand)] hover:border-[var(--brand-line)] transition-colors group" onClick={() => toast(i === 0 ? "فُتح عارض صور التقدم — قارن الأسبوع 1 مع الأسبوع 12" : `فُتحت الكاميرا لرفع صورة ${x} (تُشفَّر وتُشارك مع مدربك فقط)`, "brand")}>
                  <span className="text-center">
                    <Icon name={i === 3 ? "target" : "camera"} className="w-5 h-5 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold block">{i === 0 ? "آخر صورة: الأسبوع 10" : `رفع ${x}`}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className="glass p-5">
          <SectionTitle icon="spark" title={t("client.beforeAfter")} sub="مقارنة القياسات منذ بداية الخطة — الأوزان من مزامنة الميزان" />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.map((st, i) => (
              <div key={st.k} className="glass panel-hover p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-moss">{st.k}</span>
                  <Icon name="heart" className="w-4 h-4 text-[var(--brand)]" />
                </div>
                <div className="flex items-end gap-2 mt-2.5" dir="ltr">
                  <span className="font-display font-bold text-2xl text-snow">{st.to}</span>
                  <span className="text-[11px] text-moss mb-1">{st.unit}</span>
                  <span className="text-[10px] text-moss2 line-through mb-1">{st.from}</span>
                </div>
                <div className="mt-2.5"><Meter pct={40 + i * 11} color={i % 2 ? "#FF8A3C" : "var(--brand)"} /></div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={140}>
        <div className="glass p-5">
          <SectionTitle icon="target" title={t("client.goals")} sub="متزامنة مع مدربك" />
          <div className="grid md:grid-cols-2 gap-4">
            {GOALS.map((g) => (
              <div key={g.label} className="chip rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-snow">{g.label}</span>
                  <Badge tone={g.status === "محقق" ? "mint" : "brand"}>{g.status}</Badge>
                </div>
                <div className="mt-3"><Meter pct={g.pct} color={g.status === "محقق" ? "#45D6C0" : "var(--brand)"} /></div>
                <div className="flex justify-between text-[10px] text-moss mt-2">
                  <span>الحالي: <b className="text-snow">{g.current}</b></span>
                  <span>الهدف: <b className="text-[var(--brand)]">{g.target}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ================= check-in ================= */
function CheckinTab({ s }: { s: ClientState }) {
  const { toast, t } = useApp();
  const scaleWeight = s.scaleLog[0]?.w;
  const [form, setForm] = useState({ weight: scaleWeight ?? 86.2, energy: 4, sleep: 4, stress: 2, adherence: 90, note: "" });

  useEffect(() => { if (scaleWeight) setForm((f) => ({ ...f, weight: scaleWeight })); }, [scaleWeight]);

  const Slider = ({ label, val, set, color, hint }: { label: string; val: number; set: (n: number) => void; color: string; hint: string }) => (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="font-bold text-snow">{label}</span>
        <span className="font-display font-bold" style={{ color }}>{val}/5</span>
      </div>
      <input type="range" min={1} max={5} value={val} onChange={(e) => set(parseInt(e.target.value))} className="w-full" style={{ accentColor: color }} />
      <div className="text-[9px] text-moss2 mt-0.5">{hint}</div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
      <Reveal>
        <div className="glass p-5">
          <SectionTitle icon="calendar" title={t("client.checkinTitle")} sub={t("client.checkinSub")} />
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="text-[11px] font-bold text-snow block mb-1.5">
                  {t("client.weight")}
                  {scaleWeight && <span className="ms-2 text-[9px] font-bold text-mint">⚖️ {t("client.fromScale")}</span>}
                </span>
                <input
                  type="number" step="0.1" value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: parseFloat(e.target.value) || 0 }))}
                  className="w-full chip rounded-xl px-3 py-2.5 text-sm text-snow outline-none focus:border-[var(--brand-line)] transition-colors bg-transparent font-display font-bold"
                />
              </label>
              <div>
                <span className="text-[11px] font-bold text-snow block mb-1.5">{t("client.adherence")}</span>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min={0} max={100} step={5} value={form.adherence} onChange={(e) => setForm((f) => ({ ...f, adherence: parseInt(e.target.value) }))} className="flex-1" />
                  <span className="font-display font-bold text-[var(--brand)] w-12 text-center">{form.adherence}%</span>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              <Slider label={t("client.energy")} val={form.energy} set={(n) => setForm((f) => ({ ...f, energy: n }))} color="var(--brand)" hint="1 = منهك · 5 = ممتلئ طاقة" />
              <Slider label={t("client.sleep")} val={form.sleep} set={(n) => setForm((f) => ({ ...f, sleep: n }))} color="#45D6C0" hint="عمق النوم وانتظامه" />
              <Slider label={t("client.stress")} val={form.stress} set={(n) => setForm((f) => ({ ...f, stress: n }))} color="#FF8A3C" hint="1 = مرتاح · 5 = ضغط عالٍ" />
            </div>
            <label className="block">
              <span className="text-[11px] font-bold text-snow block mb-1.5">{t("client.noteCoach")}</span>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={3}
                placeholder="أي ألم، تعب، أو شيء تفتخر به هذا الأسبوع…"
                className="w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] transition-colors bg-transparent resize-none placeholder:text-moss2"
              />
            </label>
            <button
              onClick={() => { toast(`${t("toast.sent")} (${form.weight} كغ)`, "brand"); setForm((f) => ({ ...f, note: "" })); }}
              className="btn-brand rounded-xl px-6 py-3 text-xs font-bold flex items-center gap-2"
            >
              <Icon name="check" className="w-4 h-4" /> {t("client.send")}
            </button>
          </div>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <div className="glass p-5">
          <SectionTitle icon="bell" title={t("client.coachReplies")} sub="آخر 3 تسجيلات" />
          <div className="space-y-3">
            {[
              { w: "الأسبوع الماضي", txt: "ممتاز! زدنا أحمال السكوات 2.5كغ — فخور بالتزامك بالنوم." },
              { w: "قبل أسبوعين", txt: "خففنا الكارديو وركزنا على الأساسيات. لا تتأخر عن وجبة ما بعد التمرين." },
              { w: "قبل 3 أسابيع", txt: "بداية قوية! ثبّت مواعيد النوم وسنرى أرقاماً أفضل الأسبوع القادم." },
            ].map((r, i) => (
              <div key={i} className="chip rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[var(--brand)]">كابتن فهد</span>
                  <span className="text-[9px] text-moss2">{r.w}</span>
                </div>
                <p className="text-[11px] text-snow/90 leading-5">{r.txt}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export default function ClientApp({ tab, state, setState }: { tab: string; state: ClientState; setState: SetState }) {
  if (tab === "workouts") return <WorkoutsTab />;
  if (tab === "nutrition") return <NutritionTab s={state} setS={setState} />;
  if (tab === "devices") return <DevicesTab s={state} setS={setState} />;
  if (tab === "progress") return <ProgressTab s={state} />;
  if (tab === "checkin") return <CheckinTab s={state} />;
  return <HomeTab s={state} setS={setState} />;
}
