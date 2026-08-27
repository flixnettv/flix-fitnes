import React, { useEffect, useRef, useState } from "react";
import { CLIENTS, GOAL_MIX, MEMBERSHIP_LABEL, SESSIONS_WEEK, TRAINERS, fmt, money, type Client } from "../data";
import { BODY_FONTS, DISPLAY_FONTS, Lang } from "../i18n";
import { useApp } from "../store";
import { LangToggle } from "../components/LangToggle";
import { Avatar, Badge, Bars, Donut, Icon, IconName, Meter, Reveal, SectionTitle, Stars, Stepper, Switch, downloadCsv, useCountUp } from "../components/ui";
import AppearanceEditor from "../components/AppearanceEditor";
import {
  fetchMyAppearance, updateMyAppearance, createMember, updateMember, archiveMember,
  fetchGymStats, createTrainerAdmin, fetchMySettings, updateMySettings,
  type GymStats, type CreateMemberPayload, type MyAppearance,
} from "../lib/api";

const useL = () => {
  const { lang } = useApp();
  return (o: { ar: string; en: string }) => (lang === "ar" ? o.ar : o.en);
};

/* ================= overview ================= */
function Overview() {
  const { gym, t } = useApp();
  const [stats, setStats] = useState<GymStats | null>(null);
  useEffect(() => {
    let alive = true;
    fetchGymStats().then((s) => { if (alive) setStats(s); }).catch(() => { /* keep mocks */ });
    return () => { alive = false; };
  }, []);
  const revenue = money(stats?.totalRevenue ?? gym.mrr);
  const membersCount = stats?.totalMembers ?? CLIENTS.length;
  const trainersCount = stats?.totalTrainers ?? TRAINERS.filter((x) => x.active).length;
  const liveMembers = membersCount || gym.members;
  const liveTrainers = trainersCount || gym.trainersCount;
  const sessionsV = useCountUp(SESSIONS_WEEK.reduce((s, d) => s + d.v, 0), 1300);
  const kpis = [
    { icon: "users" as IconName, label: t("kpi.members"), v: fmt(liveMembers), d: stats ? `نشط ${stats.activeSubscriptions}` : `▲ ${gym.growth}%`, up: true },
    { icon: "dumbbell" as IconName, label: t("kpi.trainers"), v: String(liveTrainers), d: stats ? `جدد هذا الشهر ${stats.newThisMonth}` : "▲ 2", up: true },
    { icon: "bolt" as IconName, label: "جلسات الأسبوع", v: stats ? fmt(stats.expiringThisMonth) : fmt(sessionsV), d: "تنتهي هذا الشهر", up: true },
    { icon: "chart" as IconName, label: "الإيرادات", v: revenue, d: stats ? "إجمالي رسوم الأعضاء" : `▲ ${gym.growth}%`, up: true },
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
              <div className={`text-[10px] font-bold mt-1 ${k.up ? "text-mint" : "text-blush"}`}>{k.d}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        <Reveal delay={80}>
          <div className="glass p-5">
            <SectionTitle icon="bars" title={t("kpi.sessionsWeek")} sub={`${gym.nameAr} — ${t("common.live")}`} action={<Badge tone="brand">{stats ? `إيرادات ${currencyLbl} ${fmt(stats.totalRevenue)}` : `${t("kpi.retention")} ${gym.retention}%`}</Badge>} />
            {stats ? (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[["أعضاء نشطون", stats.activeSubscriptions], ["منتهيون", stats.expiredMembers], ["قيد الانتهاء", stats.expiringThisMonth]].map(([k, v]) => (
                  <div key={k as string} className="chip rounded-2xl p-4 text-center">
                    <div className="font-display font-extrabold text-2xl text-snow">{fmt(v as number)}</div>
                    <div className="text-[10px] text-moss mt-1">{k}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Bars data={SESSIONS_WEEK} h={180} />
            )}
          </div>
        </Reveal>
        <Reveal delay={140}>
          <div className="glass p-5 h-full flex flex-col">
            <SectionTitle icon="target" title="أهداف الأعضاء" sub="توزيع حسب الهدف التدريبي" />
            <div className="flex items-center justify-center gap-6 flex-1 flex-wrap">
              <Donut center={fmt(liveMembers)} sub="عضو" segments={GOAL_MIX} />
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

const currencyLbl = "ج.م";

/* ================= trainers ================= */
function Trainers() {
  const { toast, t } = useApp();
  const L = useL();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "", employee_id: "", specialization: "", hourly_rate: "" });
  const submit = async () => {
    if (!form.email.trim()) { toast(L({ ar: "البريد مطلوب", en: "Email is required" }), "blush"); return; }
    if (!form.first_name.trim()) { toast(L({ ar: "الاسم مطلوب", en: "Name is required" }), "blush"); return; }
    setBusy(true);
    try {
      await createTrainerAdmin({
        email: form.email.trim().toLowerCase(),
        password: form.password || undefined,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone,
        employee_id: form.employee_id || undefined,
        specialization: form.specialization.split(/[،,\n]+/).map((s) => s.trim()).filter(Boolean),
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
      });
      toast(L({ ar: "أُنشئ حساب المدرب وسجّل دخوله بالبريد وكلمة المرور", en: "Trainer account created — they log in with email & password" }), "mint");
      setAdding(false);
      import("../lib/api").then((m) => m.syncRealData()).catch(() => window.location.reload());
    } catch (e) {
      toast(e instanceof Error && (e.message === "400" || e.message === "409") ? L({ ar: "البريد مستخدم مسبقاً أو بيانات ناقصة", en: "Email already in use or missing data" }) : L({ ar: "فشل الإنشاء", en: "Failed" }), "blush");
    } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass p-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px] text-xs text-moss">{TRAINERS.length} مدرباً (حقيقي) · متوسط التقييم <b className="text-[var(--brand)] font-display">4.8 ★</b></div>
          <button onClick={() => setAdding(true)} className="btn-brand rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <Icon name="userPlus" className="w-4 h-4" /> إضافة مدرب
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
                {[["عملاء", `${tr.clients}/${tr.maxClients}`], ["جلسات/شهر", String(tr.sessionsMonth)], ["الأجر/ساعة", `${tr.rate} جنيه`]].map(([k, v]) => (
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
      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAdding(false)} />
          <div className="relative w-full max-w-md glass sheen rounded-3xl p-5 anim-pop">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-snow text-base">{L({ ar: "إضافة مدرب", en: "Add trainer" })}</h3>
              <button onClick={() => setAdding(false)} className="w-8 h-8 rounded-xl chip grid place-items-center text-moss hover:text-snow"><Icon name="logout" className="w-4 h-4" /></button>
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "الاسم الأول", en: "First name" })} *</span>
                  <input value={form.first_name} onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "اسم العائلة", en: "Last name" })}</span>
                  <input value={form.last_name} onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))} className={inputCls} />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "البريد", en: "Email" })} *</span>
                <input dir="ltr" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="trainer@mail.com" className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "كلمة المرور", en: "Password" })}</span>
                  <input dir="ltr" type="text" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="Trainer2026!" className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "الهاتف", en: "Phone" })}</span>
                  <input dir="ltr" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "رقم الموظف", en: "Employee ID" })}</span>
                  <input dir="ltr" value={form.employee_id} onChange={(e) => setForm((s) => ({ ...s, employee_id: e.target.value }))} placeholder="TR-0001" className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "الأجر/ساعة", en: "Hourly rate" })}</span>
                  <input dir="ltr" type="number" min={0} value={form.hourly_rate} onChange={(e) => setForm((s) => ({ ...s, hourly_rate: e.target.value }))} className={inputCls} />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "التخصصات (افصلها بفاصلة)", en: "Specializations (comma separated)" })}</span>
                <input value={form.specialization} onChange={(e) => setForm((s) => ({ ...s, specialization: e.target.value }))} placeholder={L({ ar: "قوة، تضخيم، تخسيس", en: "Strength, Hypertrophy, Fat loss" })} className={inputCls} />
              </label>
            </div>
            <button onClick={submit} disabled={busy} className="btn-brand w-full rounded-xl py-2.5 text-xs font-bold mt-5 flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="check" className="w-4 h-4" />}
              {L({ ar: "إنشاء حساب المدرب", en: "Create trainer account" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= members ================= */
const MEMBERSHIP_TYPES = [["vip", "VIP"], ["premium", "بريميوم"], ["basic", "أساسية"], ["trial", "تجريبية"]] as const;
const GOAL_PRESETS = ["تضخيم", "قوة", "تخسيس", "لياقة عامة", "تحمل", "تأهيل", "كروس فت"];

function MemberForm({
  initial, onDone, onCancel,
}: {
  initial?: { id: string; name: string; email?: string; phone?: string; membership: Client["membership"]; start?: string; end: string; fee?: number; trainerId?: string; goals: string[] };
  onDone: () => void; onCancel: () => void;
}) {
  const { toast } = useApp();
  const L = useL();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(initial?.email ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [password, setPassword] = useState("");
  const [membership, setMembership] = useState<Client["membership"]>(initial?.membership ?? "basic");
  const [fee, setFee] = useState(initial?.fee != null ? String(initial.fee) : "");
  const [start, setStart] = useState(initial?.start ?? new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(initial?.end ?? "");
  const [trainerId, setTrainerId] = useState(initial?.trainerId ?? "");
  const [goals, setGoals] = useState<string[]>(initial?.goals ?? []);

  const trainers = TRAINERS.filter((t) => t.active);
  const toggleGoal = (g: string) => setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  const submit = async () => {
    if (!initial && !email.trim()) { toast(L({ ar: "البريد مطلوب", en: "Email is required" }), "blush"); return; }
    if (!name.trim()) { toast(L({ ar: "الاسم مطلوب", en: "Name is required" }), "blush"); return; }
    setBusy(true);
    const payload: CreateMemberPayload = {
      email: email.trim().toLowerCase(), name: name.trim(), phone,
      membership_type: membership, goals,
      membership_fee: fee ? parseFloat(fee) : 0,
      membership_start: start, membership_end: end || undefined,
      trainer_id: trainerId || undefined,
    };
    if (!initial && password.trim()) payload.password = password;
    try {
      if (initial) {
        await updateMember(initial.id, {
          membership_type: membership,
          membership_fee: fee ? parseFloat(fee) : 0,
          membership_start: start, membership_end: end || undefined,
          trainer_id: trainerId || null, goals,
        });
        toast(L({ ar: "حُدّث ملف العضو بنجاح", en: "Member profile updated" }), "mint");
      } else {
        await createMember(payload);
        toast(L({ ar: "أُضيف العضو وأنشئ حسابه — سجّل دخوله بالبريد وكلمة المرور", en: "Member added & account created — they log in with the email & password" }), "mint");
      }
      onDone();
    } catch (e) {
      toast(e instanceof Error ? (e.message === "400" || e.message === "409" ? L({ ar: "البريد مستخدم مسبقاً أو بيانات ناقصة", en: "Email already in use or missing data" }) : e.message) : L({ ar: "فشل الحفظ", en: "Save failed" }), "blush");
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!initial) return;
    setBusy(true);
    try {
      await archiveMember(initial.id);
      toast(L({ ar: "أُوقف العضو — يبقى سجلّه محفوظاً", en: "Member deactivated — history kept" }), "ember");
      onDone();
    } catch {
      toast(L({ ar: "فشل الحذف", en: "Failed" }), "blush");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelClk(onCancel)} />
      <div className="relative w-full max-w-lg glass sheen rounded-3xl p-5 anim-pop">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-snow text-base">{initial ? L({ ar: "تعديل العضو", en: "Edit member" }) : L({ ar: "إضافة عضو جديد", en: "Add new member" })}</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-xl chip grid place-items-center text-moss hover:text-snow"><Icon name="logout" className="w-4 h-4" /></button>
        </div>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "الاسم الكامل", en: "Full name" })} *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "البريد", en: "Email" })} {initial ? "" : "*"}</span>
              <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@mail.com" className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "الهاتف", en: "Phone" })}</span>
              <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{initial ? L({ ar: "كلمة المرور (اختياري)", en: "Password (optional)" }) : L({ ar: "كلمة المرور", en: "Password" })}</span>
              <input dir="ltr" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Member2026!" className={inputCls} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "نوع العضوية", en: "Membership" })}</span>
              <select value={membership} onChange={(e) => setMembership(e.target.value as Client["membership"])} className={inputCls}>
                {MEMBERSHIP_TYPES.map(([v, l]) => <option key={v} value={v} className="bg-[var(--color-panel)]">{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: `الرسوم (${currencyLbl})`, en: `Fee (${currencyLbl})` })}</span>
              <input dir="ltr" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "بداية الاشتراك", en: "Start date" })}</span>
              <input dir="ltr" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "نهاية الاشتراك", en: "End date" })}</span>
              <input dir="ltr" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-bold text-moss block mb-1">{L({ ar: "المدرب", en: "Trainer" })}</span>
            <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls}>
              <option value="" className="bg-[var(--color-panel)]">{L({ ar: "بدون مدرب", en: "No trainer" })}</option>
              {trainers.map((t) => <option key={t.id} value={t.id} className="bg-[var(--color-panel)]">{t.name}</option>)}
            </select>
          </label>
          <div>
            <span className="text-[10px] font-bold text-moss block mb-1.5">{L({ ar: "الأهداف", en: "Goals" })}</span>
            <div className="flex gap-1.5 flex-wrap">
              {GOAL_PRESETS.map((g) => (
                <button key={g} type="button" onClick={() => toggleGoal(g)} className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition-all ${goals.includes(g) ? "tab-active" : "border-[var(--glass-border)] text-moss2"}`}>
                  {goals.includes(g) ? "✓ " : ""}{g}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={submit} disabled={busy} className="btn-brand flex-1 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="check" className="w-4 h-4" />}
            {L({ ar: initial ? "حفظ التعديلات" : "إضافة العضو", en: initial ? "Save changes" : "Add member" })}
          </button>
          {initial && (
            <button onClick={archive} disabled={busy} className="rounded-xl px-4 py-2.5 text-[11px] font-bold bg-blush/15 border border-blush/40 text-blush disabled:opacity-50">
              {L({ ar: "إيقاف", en: "Deactivate" })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function cancelClk(onCancel: () => void) {
  return () => onCancel();
}

function Members() {
  const { toast, t } = useApp();
  const L = useL();
  const [f, setF] = useState<"all" | "vip" | "premium" | "basic" | "trial">("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const list = CLIENTS.filter((c) => f === "all" || c.membership === f);
  const editingMember = editing ? CLIENTS.find((c) => c.id === editing) ?? null : null;
  const refreshAndClose = () => {
    setAdding(false);
    setEditing(null);
    import("../lib/api").then((m) => m.syncRealData()).catch(() => window.location.reload());
  };
  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="glass p-4 flex items-center gap-2.5 flex-wrap">
          {([["all", "الكل"], ["vip", "VIP"], ["premium", "بريميوم"], ["basic", "أساسية"], ["trial", "تجريبية"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all ${f === k ? "tab-active" : "border-[var(--glass-border)] text-moss hover:text-snow"}`}>{l}</button>
          ))}
          <div className="ms-auto flex gap-2">
            <button onClick={() => setAdding(true)} className="btn-brand rounded-xl px-4 py-2 text-[11px] font-bold flex items-center gap-2"><Icon name="userPlus" className="w-4 h-4" /> إضافة عضو</button>
            <button onClick={() => toast(L({ ar: "التصدير من قسم «البيانات والنسخ» في الإعدادات", en: "Export lives in Settings → Data & backup" }), "sky")} className="btn-ghost rounded-xl px-4 py-2 text-[11px] font-bold text-moss">استيراد CSV</button>
          </div>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((c) => {
          const m = c as Client & { membershipStart?: string; membershipFee?: number; email?: string; phone?: string };
          return (
            <Reveal key={c.id} delay={50}>
              <button onClick={() => setEditing(c.id)} className="text-right block w-full glass panel-hover p-4 hover:border-[var(--brand-line)] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-snow truncate">{c.name}</div>
                    <div className="text-[10px] text-moss2 mt-0.5">عضو حتى <span dir="ltr">{c.membershipEnd}</span></div>
                  </div>
                  <Badge tone={c.membership === "vip" ? "ember" : c.membership === "premium" ? "brand" : "moss"}>{MEMBERSHIP_LABEL[c.membership]}</Badge>
                </div>
                {(m.membershipFee != null && m.membershipFee > 0) && (
                  <div className="text-[10px] text-moss mt-2">رسوم: <b className="text-[var(--brand)] font-display">{m.membershipFee} {currencyLbl}</b> · اشتراك يبدأ <span dir="ltr">{m.membershipStart || "—"}</span></div>
                )}
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[10px] text-moss w-14 shrink-0">التزام {c.adherence}%</span>
                  <Meter pct={c.adherence} color={c.adherence >= 85 ? "var(--brand)" : "#FF8A3C"} />
                </div>
                <div className="flex items-center justify-between mt-2.5 text-[10px] text-moss">
                  <span>🎯 {c.goals.join(" · ")}</span>
                  <span className="flex items-center gap-1"><span className="text-mint">✎</span> تعديل</span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
      {adding && <MemberForm onDone={refreshAndClose} onCancel={() => setAdding(false)} />}
      {editingMember && <MemberForm initial={{ id: editingMember.id, name: editingMember.name, email: (editingMember as never as { email?: string }).email ?? "", phone: (editingMember as never as { phone?: string }).phone ?? "", membership: editingMember.membership, start: (editingMember as never as { membershipStart?: string }).membershipStart ?? "", end: editingMember.membershipEnd, fee: (editingMember as never as { membershipFee?: number }).membershipFee, trainerId: editingMember.trainerId, goals: editingMember.goals }} onDone={refreshAndClose} onCancel={() => setEditing(null)} />}
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
          <SectionTitle icon="heart" title={t("dev.memberDevices")} sub="أجهزة الأعضاء المتصلة — تُربط من تطبيق العميل (إحصائيات مجمّعة قريباً)" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { k: "أعضاء الصالة", v: String(CLIENTS.length || 0), icon: "users" as IconName, tone: "var(--brand)" },
              { k: "أجهزة مربوطة", v: "—", icon: "heart" as IconName, tone: "#FF8A3C" },
              { k: "قياسات ميزان اليوم", v: "قريباً", icon: "target" as IconName, tone: "#45D6C0" },
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
  const { toast } = useApp();
  const [info, setInfo] = useState({ city: "", address: "", phone: "", email: "", currency: "EGP" });
  const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
  const DAY_AR: Record<string, string> = { saturday: "السبت", sunday: "الأحد", monday: "الاثنين", tuesday: "الثلاثاء", wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة" };
  const [opening, setOpening] = useState<Record<string, { enabled: boolean; open: string; close: string }>>(
    () => Object.fromEntries(DAYS.map((d) => [d, { enabled: true, open: "06:00", close: "23:30" }])),
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetchMySettings().then((s) => {
      setInfo({ city: s.city || "", address: s.address || "", phone: s.contact_phone || "", email: s.contact_email || "", currency: s.currency || "EGP" });
      const oh = s.opening_hours as Record<string, { enabled?: boolean; open?: string; close?: string }> | undefined;
      if (oh) {
        setOpening(Object.fromEntries(DAYS.map((d) => [d, { enabled: oh[d]?.enabled !== false, open: oh[d]?.open || "06:00", close: oh[d]?.close || "23:30" }])));
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await updateMySettings({
        city: info.city, address: info.address,
        contact_phone: info.phone, contact_email: info.email,
        currency: info.currency,
        opening_hours: opening as unknown as Record<string, unknown>,
      });
      toast(L({ ar: "حُفظت الإعدادات العامة وطُبّقت فوراً ✓", en: "General settings saved & applied ✓" }), "mint");
    } catch {
      toast(L({ ar: "فشل الحفظ — تأكد من صلاحية تحرير الإعدادات", en: "Save failed — check manage_settings permission" }), "blush");
    } finally { setSaving(false); }
  };
  return (
    <>
      {!loaded && <div className="glass p-5 text-xs text-moss">{"جارٍ تحميل الإعدادات…"}</div>}
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
          {DAYS.map((d) => (
            <button key={d} onClick={() => setOpening((s) => ({ ...s, [d]: { ...s[d], enabled: !s[d].enabled } }))} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${opening[d].enabled ? "tab-active" : "border-[var(--glass-border)] text-moss2 line-through"}`}>
              {DAY_AR[d]}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "يفتح", en: "Opens" })}</span>
            <input type="time" dir="ltr" value={opening.monday.open} onChange={(e) => setOpening((s) => ({ ...s, monday: { ...s.monday, open: e.target.value } }))} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "يغلق", en: "Closes" })}</span>
            <input type="time" dir="ltr" value={opening.monday.close} onChange={(e) => setOpening((s) => ({ ...s, monday: { ...s.monday, close: e.target.value } }))} className={inputCls} />
          </label>
        </div>
      </div>
      <div className="glass p-5">
        <SectionTitle icon="grid" title={L({ ar: "المحلية والفوترة", en: "Locale & billing" })} sub={L({ ar: "عملة الفواتير والتقارير", en: "Invoice & report currency" })} />
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <label className="block">
            <span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "العملة", en: "Currency" })}</span>
            <select value={info.currency} onChange={(e) => setInfo((s) => ({ ...s, currency: e.target.value }))} className={inputCls}>
              {[["EGP", "ج.م"], ["USD", "$"], ["EUR", "€"], ["AED", "د.إ"]].map(([c, s]) => <option key={c} value={c} className="bg-[var(--color-panel)]">{c} — {s}</option>)}
            </select>
          </label>
        </div>
      </div>
      <button onClick={save} disabled={saving} className="btn-brand rounded-xl px-6 py-3 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="check" className="w-4 h-4" />}
        {L({ ar: "حفظ الإعدادات العامة", en: "Save general settings" })}
      </button>
    </>
  );
}

function PlansSection() {
  const L = useL();
  const { toast } = useApp();
  const active = CLIENTS;
  const byType = (["vip", "premium", "basic", "trial"] as const).map((k) => ({ k, label: MEMBERSHIP_LABEL[k], n: active.filter((c) => c.membership === k).length }));
  const empty = active.length === 0;
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="star" title={L({ ar: "العضويات والأسعار", en: "Memberships & pricing" })} sub={L({ ar: "الاشتراك قيمة ومدّة لكل عضو تُدخَل من قسم «الأعضاء» بعملة الصالة", en: "Subscription amount & duration are entered per member from the Members tab" })} />
        {empty ? (
          <div className="chip rounded-2xl p-6 text-center">
            <div className="text-xs font-bold text-snow mb-1">{L({ ar: "لا يوجد أعضاء بعد", en: "No members yet" })}</div>
            <div className="text-[10px] text-moss">{L({ ar: "أضف أول عضو من قسم «الأعضاء» وأدخل رسوم اشتراكه وتواريخه", en: "Add your first member from the Members tab and set their fee & dates" })}</div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-4 gap-3">
              {byType.map((b) => (
                <div key={b.k} className="chip rounded-2xl p-4">
                  <div className="text-[10px] text-moss">{b.label}</div>
                  <div className="font-display font-extrabold text-2xl text-snow mt-1">{b.n}</div>
                  <div className="text-[9px] text-moss2 mt-0.5">{L({ ar: "عضو", en: "members" })}</div>
                </div>
              ))}
            </div>
            <div className="chip rounded-2xl p-4 mt-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)]"><Icon name="chart" className="w-5 h-5" /></span>
              <div className="flex-1">
                <div className="text-xs font-bold text-snow">{L({ ar: "إجمالي الرسوم المسجلة", en: "Total recorded fees" })}</div>
                <div className="text-[10px] text-moss mt-0.5">{L({ ar: "مجموع رسوم الاشتراكات الحالية بجنيه مصري (ج.م)", en: "Sum of current memberships in EGP" })}</div>
              </div>
              <div className="font-display font-extrabold text-2xl text-[var(--brand)]">{fmt(active.reduce((s, c) => s + Number((c as never as { membershipFee?: number }).membershipFee ?? 0), 0))} ج.م</div>
            </div>
          </>
        )}
        <button onClick={() => toast(L({ ar: "انتقل إلى قسم «الأعضاء» لإدارة الاشتراكات", en: "Manage subscriptions from the Members tab" }), "sky")} className="btn-brand rounded-xl px-6 py-3 text-xs font-bold flex items-center gap-2 mt-4">
          <Icon name="users" className="w-4 h-4" /> {L({ ar: "إدارة عضوية عضو", en: "Manage a member's subscription" })}
        </button>
      </div>
    </>
  );
}

function NotifSection() {
  const L = useL();
  const { toast } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [ch, setCh] = useState({ email: true, sms: false, push: true });
  const [ev, setEv] = useState({ welcome: true, session: true, expiry: true, report: true, invoice: false });
  const [expDays, setExpDays] = useState(7);
  const [quiet, setQuiet] = useState({ on: true, from: "22:00", to: "07:00" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetchMySettings().then((s) => {
      const c = s.notification_config as Record<string, unknown> | undefined;
      if (c && typeof c === "object") {
        const channels = c.channels as Record<string, unknown> | undefined;
        const events = c.events as Record<string, unknown> | undefined;
        const quietCfg = c.quiet_hours as Record<string, unknown> | undefined;
        if (channels) { setCh((p) => ({ ...p, ...Object.fromEntries(Object.entries(channels).map(([k, v]) => [k, Boolean(v)])) })); }
        if (events) { setEv((p) => ({ ...p, ...Object.fromEntries(Object.entries(events).map(([k, v]) => [k, Boolean(v)])) })); }
        if (typeof c.expiry_days === "number") setExpDays(c.expiry_days);
        if (quietCfg) setQuiet({ on: quietCfg.on !== false, from: String(quietCfg.from || "22:00"), to: String(quietCfg.to || "07:00") });
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await updateMySettings({
        notification_config: {
          channels: ch, events: ev, expiry_days: expDays, quiet_hours: quiet,
        } as unknown as Record<string, unknown>,
      });
      toast(L({ ar: "حُفظت إعدادات الإشعارات ✓", en: "Notification settings saved ✓" }), "mint");
    } catch {
      toast(L({ ar: "فشل الحفظ", en: "Save failed" }), "blush");
    } finally { setSaving(false); }
  };
  const Row = ({ on, onClick, k, d }: { on: boolean; onClick: () => void; k: string; d: string }) => (
    <div className="chip rounded-xl p-3.5 flex items-center gap-3">
      <div className="flex-1"><div className="text-xs font-bold text-snow">{k}</div><div className="text-[10px] text-moss mt-0.5">{d}</div></div>
      <Switch on={on} onClick={onClick} />
    </div>
  );
  return (
    <>
      {!loaded && <div className="glass p-5 text-xs text-moss">{"جارٍ تحميل الإعدادات…"}</div>}
      <div className="glass p-5">
        <SectionTitle icon="bell" title={L({ ar: "قنوات الإرسال", en: "Delivery channels" })} sub={L({ ar: "SMS برسوم لكل رسالة — Email وPush مجانيان", en: "SMS is metered — Email & Push are free" })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Row on={ch.email} onClick={() => setCh((s) => ({ ...s, email: !s.email }))} k="Email" d={L({ ar: "قوالب مصممة بعلامتك", en: "Templates styled with your brand" })} />
          <Row on={ch.sms} onClick={() => setCh((s) => ({ ...s, sms: !s.sms }))} k="SMS" d={L({ ar: "رسوم لكل رسالة", en: "Per-message fee" })} />
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
        <button onClick={save} disabled={saving} className="btn-brand rounded-xl px-5 py-2.5 text-[11px] font-bold flex items-center gap-2 disabled:opacity-60">
          {saving ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="check" className="w-4 h-4" />}
          {L({ ar: "حفظ الإعدادات", en: "Save settings" })}
        </button>
      </div>
    </>
  );
}

function SecuritySection() {
  const L = useL();
  return (
    <div className="glass p-8 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] mb-4"><Icon name="shield" className="w-8 h-8" /></div>
      <div className="font-display font-bold text-snow text-lg">{L({ ar: "الأمان والجلسات — قريباً", en: "Security & sessions — coming soon" })}</div>
      <div className="text-[11px] text-moss mt-2 max-w-md mx-auto leading-5">{L({ ar: "التحقق بخطوتين، سياسة كلمات المرور، وإدارة الجلسات النشطة ستتوفر قريباً. حالياً كل حساب محمي بمصادقة JWT مع انتهاء صلاحية للتجديد.", en: "2FA, password policy, and active-session management are coming soon. Today every account is protected by JWT auth with rotating tokens." })}</div>
    </div>
  );
}

function PaymentsSection() {
  const L = useL();
  return (
    <div className="glass p-8 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] mb-4"><Icon name="chart" className="w-8 h-8" /></div>
      <div className="font-display font-bold text-snow text-lg">{L({ ar: "بوابات الدفع — قريباً", en: "Payment gateways — coming soon" })}</div>
      <div className="text-[11px] text-moss mt-2 max-w-md mx-auto leading-5">{L({ ar: "الدفع الإلكتروني والتجديد التلقائي سيأتيان لاحقاً. حالياً تُسجَّل اشتراكات الأعضاء يدوياً بعملة الصالة (ج.م) من قسم «الأعضاء».", en: "Online payments & auto-renewal are coming later. Today member subscriptions are recorded manually in your gym currency (EGP) from the Members tab." })}</div>
    </div>
  );
}

function ApiSection() {
  const L = useL();
  return (
    <div className="glass p-8 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)] mb-4"><Icon name="bolt" className="w-8 h-8" /></div>
      <div className="font-display font-bold text-snow text-lg">{L({ ar: "مفاتيح API والتكاملات — قريباً", en: "API keys & integrations — coming soon" })}</div>
      <div className="text-[11px] text-moss mt-2 max-w-md mx-auto leading-5">{L({ ar: "مفاتيح API نصّية، Webhooks، وربط Zapier/WhatsApp/Google Calendar ستتوفر قريباً لعبّاد هذه النسخة.", en: "Scoped API keys, Webhooks, and Zapier / WhatsApp / Google Calendar connections are coming soon for this version." })}</div>
    </div>
  );
}

function DataSection() {
  const L = useL();
  const { toast } = useApp();
  const [confirmDel, setConfirmDel] = useState("");
  return (
    <>
      <div className="glass p-5">
        <SectionTitle icon="layers" title={L({ ar: "النسخ الاحتياطي", en: "Backups" })} sub={L({ ar: "يُدار تلقائياً على خوادم FitPro — النسخ اليدوي قريباً", en: "Managed automatically on FitPro servers — manual backups coming soon" })} />
        <div className="chip rounded-xl p-4 text-[11px] text-moss flex items-center gap-3">
          <Icon name="shield" className="w-4 h-4 text-mint shrink-0" />
          {L({ ar: "منصة FitPro تنسخ بياناتك يومياً على خوادم مشفَّرة. سيصلك إشعار عند توفر النسخ اليدوي والاستعادة بنقطة زمنية.", en: "FitPro backs up your data daily to encrypted servers. You'll be notified when manual backups & point-in-time restore arrive." })}
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
          <div className="btn-ghost rounded-xl p-4 opacity-60 cursor-not-allowed">
            <div className="text-xs font-bold text-snow">{L({ ar: "سجل تقدم الأوزان", en: "Weight progress log" })}</div>
            <div className="text-[10px] text-moss mt-1">{L({ ar: "قريباً", en: "Coming soon" })}</div>
          </div>
        </div>
      </div>
      <div className="rounded-[calc(var(--radius)*1px)] border border-blush/35 bg-blush/5 p-5">
        <SectionTitle icon="trash" title={L({ ar: "منطقة الخطر", en: "Danger zone" })} sub={L({ ar: "إجراءات لا يمكن التراجع عنها", en: "Actions that cannot be undone" })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="chip rounded-xl p-4 !border-blush/25 opacity-60">
            <div className="text-xs font-bold text-snow">{L({ ar: "حذف صور التقدم", en: "Delete progress photos" })}</div>
            <div className="text-[10px] text-moss mt-1 mb-3">{L({ ar: "قريباً", en: "Coming soon" })}</div>
            <div className="flex gap-2">
              <input value={confirmDel} onChange={(e) => setConfirmDel(e.target.value)} placeholder={L({ ar: "حذف", en: "DELETE" })} className={`${inputCls} flex-1 !border-blush/30`} />
              <button disabled className="rounded-xl px-4 py-2 text-[10px] font-bold bg-blush/15 border border-blush/40 text-blush disabled:opacity-40">
                {L({ ar: "حذف نهائي", en: "Delete" })}
              </button>
            </div>
          </div>
          <div className="chip rounded-xl p-4 !border-blush/25 opacity-60">
            <div className="text-xs font-bold text-snow">{L({ ar: "نقل ملكية الصالة", en: "Transfer gym ownership" })}</div>
            <div className="text-[10px] text-moss mt-1 mb-3">{L({ ar: "قريباً", en: "Coming soon" })}</div>
            <button className="rounded-xl px-4 py-2 text-[10px] font-bold bg-ember/15 border border-ember/40 text-ember opacity-60">
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
