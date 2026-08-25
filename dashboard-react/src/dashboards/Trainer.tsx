import { useMemo, useState } from "react";
import {
  CHECKINS, CLIENTS, EXERCISES, FOODS, GOALS, MEAL_TEMPLATE, MUSCLES,
  PlanDay, PlanExercise, TRAINERS, WEIGHT_SERIES, WORKOUT_TEMPLATE, Meal,
} from "../data";
import { useApp } from "../store";
import { AreaChart, Avatar, Badge, Icon, Meter, Reveal, Ring, SectionTitle, Sparkline } from "../components/ui";

/* ---------------- clients tab ---------------- */
function ClientsTab() {
  const { toast } = useApp();
  const trainer = TRAINERS[0];
  const myClients = CLIENTS.filter((c) => c.trainerId === trainer.id);
  const [sel, setSel] = useState(myClients[0].id);
  const client = myClients.find((c) => c.id === sel)!;

  return (
    <div className="grid lg:grid-cols-[1fr_1.35fr] gap-5">
      <div className="grid gap-4 content-start">
        <Reveal>
          <div className="panel p-4 flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-sm text-snow">{trainer.name}</div>
              <div className="text-[10px] text-moss mt-0.5">{myClients.length} من {trainer.maxClients} سعة · تخصص: {trainer.spec.join(" + ")}</div>
            </div>
            <button onClick={() => toast("فُتح نموذج تسجيل متدرب جديد — يُربط حساب المتدرب بملفك تلقائياً", "mint")} className="btn-brand rounded-xl px-3.5 py-2 text-[11px] font-bold flex items-center gap-1.5">
              <Icon name="userPlus" className="w-4 h-4" /> متدرب جديد
            </button>
          </div>
        </Reveal>
        {myClients.map((c, i) => {
          const on = c.id === sel;
          return (
            <Reveal key={c.id} delay={i * 70}>
              <button
                onClick={() => setSel(c.id)}
                className={`w-full text-right panel p-4 flex items-center gap-3 transition-all duration-300 ${on ? "!border-[var(--brand-line)] bg-[var(--brand-soft)] -translate-y-0.5" : "panel-hover"}`}
              >
                <Avatar name={c.name} color={on ? "var(--brand)" : undefined} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-snow truncate">{c.name}</span>
                    {c.streak > 0 && <span className="text-[9px] text-ember font-bold">🔥{c.streak}</span>}
                  </div>
                  <div className="text-[10px] text-moss mt-0.5">{c.goals.join(" · ")} — {c.weight} كغ</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {i % 2 === 0 ? (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-mint/10 text-mint border border-mint/35 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-2.5 h-2.5"><circle cx="12" cy="12" r="6" /><path d="M9.5 4.5 9 2.5M14.5 4.5 15 2.5M9.5 19.5 9 21.5M14.5 19.5 15 21.5" /></svg>
                        ساعة متزامنة
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md chip text-moss2">لا جهاز مرتبط</span>
                    )}
                    {i % 3 === 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand-line)]">⚖️ ميزان</span>}
                  </div>
                  <Meter pct={c.adherence} color={c.adherence >= 85 ? "var(--brand)" : "#FF8A3C"} />
                </div>
                <div className="text-left shrink-0">
                  <div className="font-display font-bold text-sm" style={{ color: on ? "var(--brand)" : "var(--color-moss)" }}>{c.adherence}%</div>
                  <div className="text-[9px] text-moss2">التزام</div>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={120}>
        <div className="panel p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <Avatar name={client.name} size="lg" color="var(--brand)" />
              <div>
                <div className="font-display font-bold text-lg text-snow leading-6">{client.name}</div>
                <div className="text-[11px] text-moss mt-1">
                  انضم قبل {client.joinedWeeks} أسبوع · عضو حتى {client.membershipEnd} · آخر تمرين: <b className="text-snow">{client.lastWorkout}</b>
                </div>
              </div>
            </div>
            <Badge tone={client.adherence >= 85 ? "brand" : "ember"}>التزام {client.adherence}%</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              ["الوزن الحالي", `${client.weight} كغ`],
              ["البداية", `${client.startWeight} كغ`],
              ["الهدف", `${client.targetWeight} كغ`],
              ["الفرق", `${(client.startWeight - client.weight).toFixed(1)} كغ`],
            ].map(([k, v]) => (
              <div key={k} className="chip rounded-xl p-3 text-center">
                <div className="text-[10px] text-moss">{k}</div>
                <div className="font-display font-bold text-lg text-snow mt-1">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-moss">منحنى الوزن — 12 أسبوع</span>
              <Badge tone="mint">▼ {(client.startWeight - client.weight).toFixed(1)} كغ</Badge>
            </div>
            <AreaChart data={WEIGHT_SERIES} h={150} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <span className="text-[11px] font-bold text-moss block mb-2">الأهداف النشطة</span>
              <div className="space-y-2.5">
                {GOALS.slice(0, 3).map((g) => (
                  <div key={g.label} className="chip rounded-xl p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-snow font-bold">{g.label}</span>
                      <Badge tone={g.status === "محقق" ? "mint" : "brand"}>{g.status}</Badge>
                    </div>
                    <div className="mt-2"><Meter pct={g.pct} color={g.status === "محقق" ? "#45D6C0" : "var(--brand)"} /></div>
                    <div className="text-[10px] text-moss mt-1.5">الحالي {g.current} ← الهدف {g.target}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-moss block mb-2">إجراء سريع</span>
              <div className="space-y-2.5">
                {[
                  { icon: "edit" as const, label: "تعديل خطة التمرين", tone: "brand" },
                  { icon: "food" as const, label: "تحديث خطة التغذية", tone: "mint" },
                  { icon: "camera" as const, label: "مراجعة صور التقدم (3 جديدة)", tone: "ember" },
                  { icon: "bell" as const, label: "إرسال تذكير جلسة الغد", tone: "sky" },
                ].map((a) => (
                  <button key={a.label} onClick={() => toast(`«${a.label}» — تم الحفظ وإشعار المتدرب`, "brand")} className="w-full btn-ghost rounded-xl px-3.5 py-2.5 text-[11px] font-bold text-moss flex items-center gap-2.5 hover:text-snow">
                    <Icon name={a.icon} className="w-4 h-4" />
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[11px] text-snow leading-5">
                <b className="font-display">ملاحظة سريرية:</b> {`لا يوجد إصابات. ضغط دم مستقر. يُفضَّل تقليل الكارديو أسبوعياً إلى جلستين.`}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ---------------- workout builder ---------------- */
const parseReps = (r: string) => {
  const n = parseInt(r, 10);
  return isNaN(n) ? 10 : n;
};

function WorkoutBuilder() {
  const { toast } = useApp();
  const [days, setDays] = useState<PlanDay[]>(() => WORKOUT_TEMPLATE.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })));
  const [activeDay, setActiveDay] = useState(0);
  const [muscle, setMuscle] = useState<string>("الكل");
  const [q, setQ] = useState("");

  const library = useMemo(
    () => EXERCISES.filter((e) => (muscle === "الكل" || e.muscle === muscle) && (e.nameAr.includes(q) || e.nameEn.toLowerCase().includes(q.toLowerCase()))),
    [muscle, q]
  );

  const day = days[activeDay];
  const totalSets = day.exercises.reduce((s, e) => s + e.sets, 0);
  const estMin = Math.round(day.exercises.reduce((s, e) => s + e.sets * (parseReps(e.reps) * 0.06 + e.rest / 60), 0));

  const addExercise = (exId: string) => {
    const ex = EXERCISES.find((e) => e.id === exId)!;
    setDays((ds) => ds.map((d, i) => (i === activeDay ? { ...d, exercises: [...d.exercises, { exId, sets: ex.defaultSets, reps: ex.defaultReps, rest: 90 }] } : d)));
    toast(`أُضيف «${ex.nameAr}» إلى ${day.name}`, "mint");
  };
  const updateEx = (idx: number, patch: Partial<PlanExercise>) =>
    setDays((ds) => ds.map((d, i) => (i === activeDay ? { ...d, exercises: d.exercises.map((e, j) => (j === idx ? { ...e, ...patch } : e)) } : d)));
  const removeEx = (idx: number) =>
    setDays((ds) => ds.map((d, i) => (i === activeDay ? { ...d, exercises: d.exercises.filter((_, j) => j !== idx) } : d)));

  const Step = ({ onPlus, onMinus }: { onPlus: () => void; onMinus: () => void }) => (
    <span className="flex items-center gap-1">
      <button onClick={onMinus} className="w-6 h-6 rounded-md chip grid place-items-center text-moss hover:text-blush hover:!border-blush/40 transition-colors"><Icon name="minus" className="w-3 h-3" /></button>
      <button onClick={onPlus} className="w-6 h-6 rounded-md chip grid place-items-center text-moss hover:text-mint hover:!border-mint/40 transition-colors"><Icon name="plus" className="w-3 h-3" /></button>
    </span>
  );

  return (
    <div className="grid xl:grid-cols-[1fr_1.45fr] gap-5">
      {/* library */}
      <Reveal>
        <div className="panel p-4 xl:sticky xl:top-4 self-start">
          <SectionTitle icon="layers" title="مكتبة التمارين" sub={`${library.length} تمرين · عامة + مخصصة للصال`} />
          <div className="flex items-center gap-2 chip rounded-xl px-3 py-2 mb-3">
            <Icon name="search" className="w-4 h-4 text-moss" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن تمرين…" className="bg-transparent outline-none text-xs flex-1 placeholder:text-moss2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {["الكل", ...MUSCLES].map((m) => (
              <button key={m} onClick={() => setMuscle(m)} className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${muscle === m ? "tab-active" : "border-line text-moss hover:text-snow"}`}>{m}</button>
            ))}
          </div>
          <div className="space-y-2 max-h-[430px] overflow-y-auto pl-1">
            {library.map((ex) => (
              <div key={ex.id} className="chip rounded-xl px-3 py-2.5 flex items-center gap-2.5 group hover:!border-[var(--brand-line)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-snow truncate">{ex.nameAr}</div>
                  <div className="text-[9px] text-moss2 mt-0.5" dir="ltr">{ex.nameEn}</div>
                </div>
                <Badge tone={ex.difficulty === "متقدم" ? "blush" : ex.difficulty === "متوسط" ? "ember" : "mint"}>{ex.muscle}</Badge>
                <button onClick={() => addExercise(ex.id)} className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] grid place-items-center opacity-60 group-hover:opacity-100 transition-all hover:scale-110" aria-label="إضافة">
                  <Icon name="plus" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {library.length === 0 && <p className="text-[11px] text-moss2 text-center py-6">لا نتائج مطابقة — جرّب كلمة أخرى</p>}
          </div>
        </div>
      </Reveal>

      {/* builder */}
      <Reveal delay={100}>
        <div className="panel p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <div className="font-display font-bold text-snow">{WORKOUT_TEMPLATE.name}</div>
              <div className="text-[10px] text-moss mt-0.5">{WORKOUT_TEMPLATE.weeks} أسابيع · {WORKOUT_TEMPLATE.level} · هدف: {WORKOUT_TEMPLATE.goal} · قالب قابل لإعادة الاستخدام</div>
            </div>
            <button onClick={() => toast("أُسندت الخطة إلى 3 متدربين مع إشعار فوري", "brand")} className="btn-brand rounded-xl px-4 py-2 text-[11px] font-bold flex items-center gap-2">
              <Icon name="check" className="w-4 h-4" /> إسناد لمتدرب
            </button>
          </div>

          <div className="flex gap-1.5 flex-wrap mb-4">
            {days.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)} className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all ${i === activeDay ? "tab-active" : "border-line text-moss hover:text-snow"}`}>
                {d.name} <span className="opacity-60">({d.exercises.length})</span>
              </button>
            ))}
          </div>

          <div className="chip rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-3">
            <Icon name="target" className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-bold text-snow">{day.focus}</span>
            <span className="mr-auto flex items-center gap-4 text-[10px] text-moss">
              <span>{day.exercises.length} تمرين</span>
              <span>{totalSets} مجموعة</span>
              <span className="flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5" /> ~{estMin} دقيقة</span>
            </span>
          </div>

          <div className="space-y-2.5">
            {day.exercises.map((ex, idx) => {
              const info = EXERCISES.find((e) => e.id === ex.exId)!;
              return (
                <div key={`${ex.exId}-${idx}`} className="panel p-3.5 flex items-center gap-3 anim-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <span className="font-display font-bold text-moss2 w-5 text-center">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-snow truncate">{info.nameAr}</div>
                    <div className="text-[9px] text-moss2 mt-0.5">{info.muscle} · {info.equipment} · {info.difficulty}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <div className="font-display font-bold text-sm text-[var(--brand)] w-14">{ex.sets} <span className="text-[9px] text-moss">مج</span></div>
                      <Step onPlus={() => updateEx(idx, { sets: Math.min(8, ex.sets + 1) })} onMinus={() => updateEx(idx, { sets: Math.max(1, ex.sets - 1) })} />
                    </div>
                    <div className="text-center w-20">
                      <input
                        value={ex.reps}
                        onChange={(e) => updateEx(idx, { reps: e.target.value })}
                        className="w-full bg-transparent text-center font-display font-bold text-sm text-snow outline-none border-b border-transparent focus:border-[var(--brand-line)] transition-colors"
                      />
                      <div className="text-[9px] text-moss2">تكرار</div>
                    </div>
                    <div className="text-center">
                      <div className="font-display font-bold text-sm text-snow w-14">{ex.rest}<span className="text-[9px] text-moss"> ث</span></div>
                      <Step onPlus={() => updateEx(idx, { rest: Math.min(300, ex.rest + 15) })} onMinus={() => updateEx(idx, { rest: Math.max(0, ex.rest - 15) })} />
                    </div>
                    <button onClick={() => { removeEx(idx); toast(`حُذف «${info.nameAr}» من ${day.name}`, "ember"); }} className="w-8 h-8 rounded-lg chip grid place-items-center text-moss hover:text-blush hover:!border-blush/50 transition-colors" aria-label="حذف">
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {day.exercises.length === 0 && (
              <div className="border border-dashed border-line2 rounded-xl p-8 text-center text-[11px] text-moss2">
                هذا اليوم فارغ — أضف تمارين من المكتبة ←
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/* ---------------- nutrition builder ---------------- */
function NutritionBuilder() {
  const { toast } = useApp();
  const [meals, setMeals] = useState<Meal[]>(() => MEAL_TEMPLATE.meals.map((m) => ({ ...m, items: m.items.map((i) => ({ ...i })) })));
  const [mealIdx, setMealIdx] = useState(0);
  const [foodQ, setFoodQ] = useState("");

  const totals = useMemo(() => {
    let cal = 0, protein = 0, carbs = 0, fat = 0;
    meals.forEach((m) => m.items.forEach((it) => {
      const f = FOODS.find((x) => x.id === it.foodId)!;
      const k = it.grams / 100;
      cal += f.cal * k; protein += f.protein * k; carbs += f.carbs * k; fat += f.fat * k;
    }));
    return { cal: Math.round(cal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
  }, [meals]);

  const t = MEAL_TEMPLATE.targets;
  const foods = FOODS.filter((f) => f.nameAr.includes(foodQ));
  const meal = meals[mealIdx];

  const addItem = (foodId: string) => {
    const f = FOODS.find((x) => x.id === foodId)!;
    setMeals((ms) => ms.map((m, i) => (i === mealIdx ? { ...m, items: [...m.items, { foodId, grams: 100 }] } : m)));
    toast(`أُضيف «${f.nameAr}» إلى ${meal.name}`, "mint");
  };
  const setGrams = (idx: number, grams: number) =>
    setMeals((ms) => ms.map((m, i) => (i === mealIdx ? { ...m, items: m.items.map((it, j) => (j === idx ? { ...it, grams: Math.max(10, grams) } : it)) } : m)));
  const removeItem = (idx: number) =>
    setMeals((ms) => ms.map((m, i) => (i === mealIdx ? { ...m, items: m.items.filter((_, j) => j !== idx) } : m)));

  const MacroBar = ({ label, val, target, color, unit = "غ" }: { label: string; val: number; target: number; color: string; unit?: string }) => (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="font-bold" style={{ color }}>{label}</span>
        <span className="font-display text-snow">{val}{unit} <span className="text-moss2 text-[10px]">/ {target}{unit}</span></span>
      </div>
      <Meter pct={(val / target) * 100} color={color} />
    </div>
  );

  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="panel p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <div className="font-display font-bold text-snow">{MEAL_TEMPLATE.name}</div>
              <div className="text-[10px] text-moss mt-0.5">هدف: {MEAL_TEMPLATE.goal} · {MEAL_TEMPLATE.meals.length} وجبات يومياً · قالب قابل للتخصيص لكل متدرب</div>
            </div>
            <div className="flex items-center gap-2.5">
              <Ring pct={(totals.cal / t.cal) * 100} size={62} thickness={6} label={`${Math.round((totals.cal / t.cal) * 100)}%`} subLabel="سعرات" />
              <button onClick={() => toast("أُسندت خطة التغذية وأُشعر المتدرب بالتحديث", "brand")} className="btn-brand rounded-xl px-4 py-2 text-[11px] font-bold flex items-center gap-2">
                <Icon name="check" className="w-4 h-4" /> إسناد الخطة
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <MacroBar label="بروتين" val={totals.protein} target={t.protein} color="var(--brand)" />
            <MacroBar label="كربوهيدرات" val={totals.carbs} target={t.carbs} color="#FF8A3C" />
            <MacroBar label="دهون" val={totals.fat} target={t.fat} color="#45D6C0" />
          </div>
        </div>
      </Reveal>

      <div className="grid xl:grid-cols-[1fr_1.4fr] gap-5">
        <Reveal delay={80}>
          <div className="panel p-4 self-start xl:sticky xl:top-4">
            <SectionTitle icon="food" title="مكتبة الأطعمة" sub="USDA + أطعمة سعودية مخصصة" />
            <div className="flex items-center gap-2 chip rounded-xl px-3 py-2 mb-3">
              <Icon name="search" className="w-4 h-4 text-moss" />
              <input value={foodQ} onChange={(e) => setFoodQ(e.target.value)} placeholder="ابحث عن طعام…" className="bg-transparent outline-none text-xs flex-1 placeholder:text-moss2" />
            </div>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
              {foods.map((f) => (
                <div key={f.id} className="chip rounded-xl px-3 py-2.5 flex items-center gap-2.5 group hover:!border-[var(--brand-line)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-snow truncate">{f.nameAr}</div>
                    <div className="text-[9px] text-moss2 mt-0.5">ب:{f.protein} · ك:{f.carbs} · د:{f.fat} / {f.serving}</div>
                  </div>
                  <span className="font-display font-bold text-[11px] text-ember">{f.cal} سعرة</span>
                  <button onClick={() => addItem(f.id)} className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] grid place-items-center opacity-60 group-hover:opacity-100 hover:scale-110 transition-all" aria-label="إضافة">
                    <Icon name="plus" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="panel p-5">
            <div className="flex gap-1.5 flex-wrap mb-4">
              {meals.map((m, i) => (
                <button key={m.name} onClick={() => setMealIdx(i)} className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all ${i === mealIdx ? "tab-active" : "border-line text-moss hover:text-snow"}`}>
                  {m.name} <span className="opacity-50" dir="ltr">{m.time}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              {meal.items.map((it, idx) => {
                const f = FOODS.find((x) => x.id === it.foodId)!;
                const k = it.grams / 100;
                return (
                  <div key={`${it.foodId}-${idx}`} className="panel p-3.5 flex items-center gap-3 anim-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                    <span className="w-9 h-9 rounded-lg grid place-items-center bg-ember/10 border border-ember/30 text-ember shrink-0">
                      <Icon name="apple" className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-snow truncate">{f.nameAr}</div>
                      <div className="text-[9px] text-moss2 mt-0.5">{Math.round(f.cal * k)} سعرة · ب {Math.round(f.protein * k)}غ · ك {Math.round(f.carbs * k)}غ · د {Math.round(f.fat * k)}غ</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setGrams(idx, it.grams - 25)} className="w-6 h-6 rounded-md chip grid place-items-center text-moss hover:text-blush transition-colors"><Icon name="minus" className="w-3 h-3" /></button>
                      <span className="font-display font-bold text-sm text-[var(--brand)] w-14 text-center">{it.grams}غ</span>
                      <button onClick={() => setGrams(idx, it.grams + 25)} className="w-6 h-6 rounded-md chip grid place-items-center text-moss hover:text-mint transition-colors"><Icon name="plus" className="w-3 h-3" /></button>
                      <button onClick={() => { removeItem(idx); toast(`حُذف «${f.nameAr}» من ${meal.name}`, "ember"); }} className="w-7 h-7 rounded-lg chip grid place-items-center text-moss hover:text-blush hover:!border-blush/50 transition-colors" aria-label="حذف">
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {meal.items.length === 0 && <div className="border border-dashed border-line2 rounded-xl p-8 text-center text-[11px] text-moss2">وجبة فارغة — أضف أطعمة من المكتبة</div>}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------------- progress tab ---------------- */
function ProgressTab() {
  const Dots = ({ n, color }: { n: number; color: string }) => (
    <span className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full transition-transform hover:scale-125" style={{ background: i <= n ? color : "var(--color-line2)" }} />
      ))}
    </span>
  );
  return (
    <div className="grid gap-5">
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        <Reveal>
          <div className="panel p-5">
            <SectionTitle icon="chart" title="منحنى وزن محمد السالم" sub="12 أسبوع — من 91.5 إلى 86.2 كغ" action={<Badge tone="brand">معدل -0.48 كغ/أسبوع</Badge>} />
            <AreaChart data={WEIGHT_SERIES} labels={["أ1", "أ2", "أ3", "أ4", "أ5", "أ6", "أ7", "أ8", "أ9", "أ10", "أ11", "أ12"]} />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="panel p-5 h-full">
            <SectionTitle icon="target" title="الأهداف" sub="4 أهداف مرتبطة بالخطة" />
            <div className="space-y-3">
              {GOALS.map((g) => (
                <div key={g.label}>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-bold text-snow">{g.label}</span>
                    <Badge tone={g.status === "محقق" ? "mint" : g.status === "متأخر" ? "blush" : "brand"}>{g.status}</Badge>
                  </div>
                  <Meter pct={g.pct} color={g.status === "محقق" ? "#45D6C0" : "var(--brand)"} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className="panel p-5">
          <SectionTitle icon="calendar" title="التسجيلات الأسبوعية" sub="Check-ins — طاقة، نوم، ضغط، والتزام" />
          <div className="grid lg:grid-cols-3 gap-4">
            {CHECKINS.map((c, i) => (
              <div key={c.week} className={`chip rounded-xl p-4 panel-hover ${i === CHECKINS.length - 1 ? "!border-[var(--brand-line)]" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-sm text-snow">{c.week}</span>
                  <Badge tone={i === CHECKINS.length - 1 ? "brand" : "moss"}>{c.weight} كغ</Badge>
                </div>
                <div className="space-y-2.5 text-[11px]">
                  {[["الطاقة", c.energy, "var(--brand)"], ["جودة النوم", c.sleep, "#45D6C0"], ["مستوى الضغط", c.stress, "#FF8A3C"]].map(([l, v, col]) => (
                    <div key={l as string} className="flex items-center justify-between">
                      <span className="text-moss">{l as string}</span>
                      <Dots n={v as number} color={col as string} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-moss">الالتزام</span>
                    <span className="font-display font-bold" style={{ color: "var(--brand)" }}>{c.adherence}%</span>
                  </div>
                </div>
                <p className="text-[10px] text-moss mt-3 leading-4 border-t border-line pt-2.5">«{c.note}»</p>
                <p className="text-[10px] text-[var(--brand)] mt-1.5 leading-4">رد المدرب: {c.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export default function Trainer({ tab }: { tab: string }) {
  if (tab === "builder") return <WorkoutBuilder />;
  if (tab === "nutrition") return <NutritionBuilder />;
  if (tab === "progress") return <ProgressTab />;
  return <ClientsTab />;
}
