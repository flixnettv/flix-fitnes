import { useMemo, useState } from "react";
import { ACTIVITY, fmt, GYMS, money, REVENUE_SERIES, TRAINERS } from "../data";
import { useApp } from "../store";
import { AreaChart, Badge, Donut, Icon, IconName, Meter, Reveal, SectionTitle, Sparkline, useCountUp } from "../components/ui";

const MONTHS = ["مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير"];

function Kpi({ icon, label, value, suffix, delta, up, spark }: { icon: IconName; label: string; value: number; suffix?: string; delta: string; up: boolean; spark: number[] }) {
  const v = useCountUp(value, 1200);
  return (
    <Reveal>
      <div className="panel panel-hover p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-moss">{label}</span>
          <span className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand-line)]">
            <Icon name={icon} className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-end justify-between mt-2 gap-2">
          <div>
            <span className="font-display font-extrabold text-[26px] leading-8 text-snow">{fmt(v)}</span>
            {suffix && <span className="text-xs text-moss mr-1">{suffix}</span>}
          </div>
          <Sparkline data={spark} w={78} h={26} color={up ? "var(--brand)" : "#F4727F"} />
        </div>
        <div className={`text-[10px] font-bold mt-1.5 ${up ? "text-mint" : "text-blush"}`}>{up ? "▲" : "▼"} {delta} عن الشهر الماضي</div>
      </div>
    </Reveal>
  );
}

function Overview() {
  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon="grid" label="صالات نشطة" value={5} delta="صالة جديدة" up={true} spark={[3, 3, 4, 4, 4, 5, 5]} />
        <Kpi icon="dumbbell" label="مدرب معتمد" value={33} delta="8.4%" up={true} spark={[22, 24, 25, 27, 29, 31, 33]} />
        <Kpi icon="users" label="متدرب نشط" value={2683} delta="12.9%" up={true} spark={[1400, 1580, 1750, 1990, 2210, 2480, 2683]} />
        <Kpi icon="chart" label="الإيراد الشهري المتكرر" value={104100} suffix="ر.س" delta="6.1%" up={true} spark={REVENUE_SERIES.slice(-7)} />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <Reveal delay={80}>
          <div className="panel p-5">
            <SectionTitle icon="chart" title="إيراد المنصة — 12 شهر" sub="MRR بالك ألف ر.س · جميع الصالات" action={<Badge tone="brand">+96.7% سنوياً</Badge>} />
            <AreaChart data={REVENUE_SERIES} labels={MONTHS} unit="k" />
          </div>
        </Reveal>
        <Reveal delay={140}>
          <div className="panel p-5 h-full flex flex-col">
            <SectionTitle icon="layers" title="توزيع الباقات" sub="5 صالات مشتركة" />
            <div className="flex items-center justify-center gap-5 flex-1">
              <Donut
                center="5" sub="صالات"
                segments={[
                  { label: "مؤسسي", value: 1, color: "#FF8A3C" },
                  { label: "احترافي", value: 2, color: "#C6F24E" },
                  { label: "أساسي", value: 2, color: "#45D6C0" },
                ]}
              />
              <div className="space-y-2.5">
                {[["مؤسسي", "1", "#FF8A3C"], ["احترافي", "2", "#C6F24E"], ["أساسي", "2", "#45D6C0"]].map(([l, v, c]) => (
                  <div key={l} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                    <span className="text-moss">{l}</span>
                    <b className="font-display text-snow mr-1">{v}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <Reveal delay={100}>
          <div className="panel p-5">
            <SectionTitle icon="spark" title="أفضل المدربين" sub="حسب تقييم المتدربين هذا الشهر" />
            <div className="space-y-3">
              {TRAINERS.filter((t) => t.active).sort((a, b) => b.rating - a.rating).slice(0, 4).map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="font-display font-bold text-moss2 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-snow truncate">{t.name}</div>
                    <Meter pct={(t.clients / t.maxClients) * 100} color={i === 0 ? "var(--brand)" : "#2f4234"} />
                  </div>
                  <Badge tone={t.rating >= 4.8 ? "brand" : "moss"}>{t.rating.toFixed(1)} ★</Badge>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={160}>
          <div className="panel p-5">
            <SectionTitle icon="bell" title="النشاط المباشر" sub="آخر الأحداث عبر جميع الصالات" action={<span className="flex items-center gap-1.5 text-[10px] text-moss"><span className="w-2 h-2 rounded-full live-dot" style={{ background: "var(--brand)" }} /> مباشر</span>} />
            <div className="space-y-1">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-line/60 last:border-0 table-row rounded-lg px-2 -mx-2">
                  <span className="w-8 h-8 rounded-lg grid place-items-center chip" style={{ color: a.tone === "brand" ? "var(--brand)" : `var(--color-${a.tone})` }}>
                    <Icon name={a.icon as IconName} className="w-4 h-4" />
                  </span>
                  <p className="flex-1 text-xs text-snow/90 leading-5">{a.text}</p>
                  <span className="text-[10px] text-moss2 whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function GymsTable() {
  const { toast, setGym, gymId } = useApp();
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(GYMS.map((g) => [g.id, g.active])));
  const [q, setQ] = useState("");
  const list = useMemo(() => GYMS.filter((g) => g.nameAr.includes(q) || g.city.includes(q)), [q]);
  const totalMembers = GYMS.reduce((s, g) => s + g.members, 0);
  const totalMrr = GYMS.reduce((s, g) => s + g.mrr, 0);

  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="panel p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 chip rounded-xl px-3 py-2 flex-1 min-w-[220px]">
            <Icon name="search" className="w-4 h-4 text-moss" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الصالة أو المدينة…" className="bg-transparent outline-none text-xs flex-1 placeholder:text-moss2" />
          </div>
          <div className="flex items-center gap-4 text-xs text-moss">
            <span>الإجمالي: <b className="font-display text-snow">{fmt(totalMembers)}</b> عضو</span>
            <span>MRR: <b className="font-display text-[var(--brand)]">{money(totalMrr)}</b></span>
          </div>
          <button onClick={() => toast("تم إرسال دعوة إنشاء صالة جديدة إلى البريد", "mint")} className="btn-brand rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" /> صالة جديدة
          </button>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[760px]">
              <thead>
                <tr className="text-[10px] text-moss border-b border-line">
                  {["الصالــة", "المدينة", "الباقة", "الأعضاء", "MRR", "النمو", "الاحتفاظ", "الحالة", ""].map((h) => (
                    <th key={h} className="font-bold px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((g) => (
                  <tr key={g.id} className="border-b border-line/50 last:border-0 table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-lg grid place-items-center font-display font-bold text-sm shrink-0" style={{ background: g.accent, color: "#0b110d" }}>{g.initial}</span>
                        <div>
                          <div className="text-xs font-bold text-snow">{g.nameAr}</div>
                          <div className="text-[10px] text-moss2" dir="ltr">{g.nameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-moss whitespace-nowrap">{g.city}</td>
                    <td className="px-4 py-3"><Badge tone={g.plan === "مؤسسي" ? "ember" : g.plan === "احترافي" ? "brand" : "mint"}>{g.plan}</Badge></td>
                    <td className="px-4 py-3 text-xs font-bold text-snow">{fmt(g.members)}</td>
                    <td className="px-4 py-3 text-xs text-moss whitespace-nowrap">{money(g.mrr)}</td>
                    <td className={`px-4 py-3 text-xs font-bold whitespace-nowrap ${g.growth >= 0 ? "text-mint" : "text-blush"}`}>{g.growth >= 0 ? "▲" : "▼"} {Math.abs(g.growth)}%</td>
                    <td className="px-4 py-3 w-28"><Meter pct={g.retention} color={g.retention >= 85 ? "var(--brand)" : g.retention >= 78 ? "#FF8A3C" : "#F4727F"} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setActive((s) => ({ ...s, [g.id]: !s[g.id] })); toast(active[g.id] ? `تم تعطيل ${g.nameAr} مؤقتاً` : `تم تفعيل ${g.nameAr}`, active[g.id] ? "ember" : "mint"); }}
                        className={`relative w-10 h-[22px] rounded-full transition-colors duration-300 ${active[g.id] ? "" : "bg-line"}`}
                        style={active[g.id] ? { background: "var(--brand)" } : undefined}
                        aria-label="toggle"
                      >
                        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-bg transition-all duration-300 ${active[g.id] ? "right-[3px]" : "right-[21px]"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setGym(g.id); toast(`تم فتح ${g.nameAr} — السمة الآن بعلامتها`, "brand"); }}
                        className={`btn-ghost rounded-lg px-3 py-1.5 text-[10px] font-bold ${gymId === g.id ? "!border-[var(--brand-line)] text-[var(--brand)]" : "text-moss"}`}
                      >
                        عرض كـ Tenant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function SystemHealth() {
  const services = [
    { name: "REST API", icon: "bolt" as IconName, uptime: "99.98%", lat: "84ms", tone: "#C6F24E", note: "p95 مستقر" },
    { name: "PostgreSQL", icon: "layers" as IconName, uptime: "99.99%", lat: "6ms", tone: "#45D6C0", note: "Replication فعال" },
    { name: "Redis Cache", icon: "clock" as IconName, uptime: "99.97%", lat: "0.4ms", tone: "#45D6C0", note: "Hit rate 94%" },
    { name: "Media Storage", icon: "camera" as IconName, uptime: "99.95%", lat: "120ms", tone: "#FF8A3C", note: "78% من السعة" },
    { name: "Push / SMTP", icon: "bell" as IconName, uptime: "99.90%", lat: "310ms", tone: "#FF8A3C", note: "Queue: 12 رسالة" },
    { name: "Nginx Edge", icon: "shield" as IconName, uptime: "100%", lat: "12ms", tone: "#C6F24E", note: "WAF + Rate limit" },
    { name: "IoT Devices Gateway", icon: "heart" as IconName, uptime: "99.93%", lat: "45ms", tone: "#45D6C0", note: "212 ساعة · 9 موازين · مزامنة لحظية" },
  ];
  const logs = [
    { t: "14:02", text: "اكتملت النسخة الاحتياطية اليومية → S3 (4.2GB)", ok: true },
    { t: "13:47", text: "Migration v2.4.1 طُبقت على الإنتاج بدون توقف", ok: true },
    { t: "11:20", text: "تنبيه: ارتفاع زمن استجابة Media Storage مؤقتاً", ok: false },
    { t: "09:00", text: "تجديد شهادة SSL تلقائياً (Let's Encrypt)", ok: true },
    { t: "03:00", text: "تشغيل مهمة حذف الصور المؤقتة المنتهية", ok: true },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((s, i) => (
          <Reveal key={s.name} delay={i * 60}>
            <div className="panel panel-hover p-4 flex items-center gap-3.5">
              <span className="relative w-10 h-10 rounded-xl grid place-items-center chip" style={{ color: s.tone }}>
                <Icon name={s.icon} className="w-5 h-5" />
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-panel)]" style={{ background: s.tone }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-snow">{s.name}</span>
                  <span className="font-display font-bold text-[13px]" style={{ color: s.tone }} dir="ltr">{s.uptime}</span>
                </div>
                <div className="text-[10px] text-moss mt-0.5">{s.note} · زمن الاستجابة <b dir="ltr" className="text-snow">{s.lat}</b></div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Reveal delay={80}>
          <div className="panel p-5">
            <SectionTitle icon="clock" title="سجل التشغيل" sub="آخر 24 ساعة — نشر، نسخ، وتنبيهات" />
            <div className="space-y-2.5">
              {logs.map((l, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="font-display text-moss2 w-10" dir="ltr">{l.t}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${l.ok ? "bg-mint" : "bg-ember"}`} />
                  <span className="text-snow/85 leading-5">{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={140}>
          <div className="panel p-5">
            <SectionTitle icon="shield" title="الأمان والامتثال" sub="فحوصات تلقائية مستمرة" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "فحص ثغرات (bandit)", v: "0 حرجة", tone: "mint" },
                { k: "محاولات دخول مرفوضة", v: "214 / 24س", tone: "ember" },
                { k: "تشفير أثناء النقل", v: "TLS 1.3", tone: "brand" },
                { k: "آخر اختبار اختراق", v: "قبل 12 يوم", tone: "moss" },
              ].map((x) => (
                <div key={x.k} className="chip rounded-xl p-3">
                  <div className="text-[10px] text-moss">{x.k}</div>
                  <div className={`mt-1 font-display font-bold text-sm ${x.tone === "mint" ? "text-mint" : x.tone === "ember" ? "text-ember" : x.tone === "brand" ? "text-[var(--brand)]" : "text-snow"}`}>{x.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl border border-dashed border-line2 text-[11px] text-moss leading-5">
              <b className="text-snow">خطة الأسبوع 7:</b> إضافة Uptime Kuma + Prometheus/Grafana، نسخ S3 يومي وأسبوعي مع PITR، واختبار حمل 100 مستخدم متزامن عبر Locust.
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function SuperAdmin({ tab }: { tab: string }) {
  if (tab === "gyms") return <GymsTable />;
  if (tab === "system") return <SystemHealth />;
  return <Overview />;
}
