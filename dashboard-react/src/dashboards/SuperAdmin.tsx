import { useEffect, useMemo, useState } from "react";
import { ACTIVITY, fmt, GYMS, money, REVENUE_SERIES, TRAINERS } from "../data";
import { useApp } from "../store";
import { fetchGyms, createGym, createTrainerStandalone, updateGym, fetchGymStats, type AdminGym } from "../lib/api";
import AppearanceEditor from "../components/AppearanceEditor";
import { fetchUsers, updateUser, setUserPassword, deleteUser, fetchTrainerAdmins,
  updateTrainerAdmin, resetTrainerPassword, deleteTrainerAdmin, type AdminUser } from "../lib/api";
import { AreaChart, Badge, Donut, Icon, IconName, Meter, Reveal, SectionTitle, Sparkline, Stepper, Switch, downloadCsv, useCountUp } from "../components/ui";

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
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => { fetchGymStats().then(setStats).catch(() => {}); }, []);

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
  const { toast } = useApp();
  const [gyms, setGyms] = useState<AdminGym[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [openGym, setOpenGym] = useState(false);
  const [openTr, setOpenTr] = useState(false);
  const [editGym, setEditGym] = useState<AdminGym | null>(null);
  const [gf, setGf] = useState({ name: "", slug: "", city: "", primary_color: "#C6F24E", admin_email: "", admin_password: "" });
  const [tf, setTf] = useState({ name: "", email: "", slug: "", primary_color: "#7FB4FF", password: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setGyms(await fetchGyms()); } catch { /* noop */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const list = gyms.filter((g) => g.name.includes(q) || g.slug.includes(q));
  const AR: Record<string, string> = { "\u0627":"a","\u0628":"b","\u062a":"t","\u062b":"s","\u062c":"j","\u062d":"h","\u062e":"k","\u062f":"d","\u0630":"z","\u0631":"r","\u0632":"z","\u0633":"s","\u0634":"sh","\u0635":"s","\u0636":"d","\u0637":"t","\u0638":"z","\u0639":"a","\u063a":"g","\u0641":"f","\u0642":"q","\u0643":"k","\u0644":"l","\u0645":"m","\u0646":"n","\u0647":"h","\u0648":"w","\u064a":"y","\u0629":"h","\u0621":"a","\u0623":"a","\u0625":"i","\u0622":"a","\u0649":"a","\u0644\u0627":"la" };
  const slugify = (s: string) => {
    const translit = s.toLowerCase().split("").map((ch) => AR[ch] ?? ch).join("");
    const base = translit.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    return base || "gym-" + Date.now().toString(36);
  };

  const submitGym = async () => {
    const slug = slugify(gf.slug || gf.name);
    if (!gf.name || slug.length < 3) { toast("\u0627\u0633\u0645 \u0648\u0635\u0628 \u062f\u0648\u0645\u064a\u0646 (3+ \u0623\u062d\u0631\u0641) \u0645\u0637\u0644\u0648\u0628", "ember"); return; }
    setBusy(true);
    try {
      const created: any = await createGym({ name: gf.name, slug, city: gf.city, primary_color: gf.primary_color,
        splash_title: gf.name, splash_style: "gradient", default_theme: "dark",
        admin_email: gf.admin_email, admin_password: gf.admin_password });
      toast("\u062a\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u2713 " + slug + ".fitpro.hftv.qzz.io", "mint");
      setOpenGym(false);
      setGf({ name: "", slug: "", city: "", primary_color: "#C6F24E", admin_email: "", admin_password: "" });
      await load();
      if (created && created.id) setEditGym(created); // open identity studio right away
    } catch { toast("\u062a\u0639\u0630\u0651\u0631 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u2014 \u0642\u062f \u064a\u0643\u0648\u0646 \u0627\u0644\u0635\u0628 \u062f\u0648\u0645\u064a\u0646 \u0645\u062d\u062c\u0648\u0632\u0627\u064b", "ember"); }
    finally { setBusy(false); }
  };

  const submitTrainer = async () => {
    const slug = slugify(tf.slug || tf.name);
    if (!tf.email || slug.length < 3) { toast("\u0627\u0644\u0628\u0631\u064a\u062f \u0648\u0627\u0644\u0635\u0628 \u062f\u0648\u0645\u064a\u0646 \u0645\u0637\u0644\u0648\u0628\u0627\u0646", "ember"); return; }
    setBusy(true);
    try {
      await createTrainerStandalone({ email: tf.email, name: tf.name, slug, primary_color: tf.primary_color,
        splash_title: tf.name, splash_style: "gradient", password: tf.password || undefined });
      toast("\u0623\u064f\u0646\u0634\u0626 \u0627\u0644\u0645\u062f\u0631\u0628 \u0627\u0644\u0645\u0633\u062a\u0642\u0644 \u2713 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631: Trainer2026!", "mint");
      setOpenTr(false); setTf({ name: "", email: "", slug: "", primary_color: "#7FB4FF" });
      await load();
    } catch { toast("\u062a\u0639\u0630\u0651\u0631 \u0627\u0644\u0625\u0646\u0634\u0627\u0621", "ember"); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-5">
      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 chip rounded-xl px-3 py-2 flex-1 min-w-[220px]">
          <Icon name="search" className="w-4 h-4 text-moss" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={"\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u0635\u0627\u0644\u0629\u2026"} className="bg-transparent outline-none text-xs flex-1 placeholder:text-moss2" />
        </div>
        <button onClick={() => setOpenTr(true)} className="btn-ghost rounded-xl px-4 py-2.5 text-[11px] font-bold text-moss hover:text-snow flex items-center gap-1.5">
          <Icon name="dumbbell" className="w-4 h-4" /> {"\u0645\u062f\u0631\u0628 \u0645\u0633\u062a\u0642\u0644"}
        </button>
        <button onClick={() => setOpenGym(true)} className="btn-brand rounded-xl px-4 py-2.5 text-[11px] font-bold flex items-center gap-1.5">
          <Icon name="plus" className="w-4 h-4" /> {"\u0635\u0627\u0644\u0629 \u062c\u062f\u064a\u062f\u0629"}
        </button>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-xs text-moss">{"\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026"}</div>
      ) : list.length === 0 ? (
        <div className="panel p-10 text-center text-xs text-moss">{"\u0644\u0627 \u0635\u0627\u0644\u0627\u062a \u2014 \u0623\u0646\u0634\u0626 \u0623\u0648\u0644\u0649"}</div>
      ) : (
        <div className="grid gap-3">
          {list.map((g, i) => (
            <div key={g.id} className="glass panel-hover rounded-2xl p-4 flex flex-wrap items-center gap-4 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="w-11 h-11 rounded-2xl grid place-items-center font-display font-extrabold text-sm shrink-0"
                style={{ background: g.primary_color, color: "#0b110d" }}>{g.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-sm text-snow truncate">{g.name}</div>
                <div className="text-[10px] text-moss2 mt-0.5" dir="ltr">{g.slug}.fitpro.hftv.qzz.io</div>
              </div>
              <span className="text-[9px] font-bold px-2 py-1 rounded-md border" style={{ color: g.primary_color, borderColor: g.primary_color + "55", background: g.primary_color + "18" }}>
                {g.kind === "personal" ? "\u0645\u062f\u0631\u0628 \u0645\u0633\u062a\u0642\u0644" : "\u0635\u0627\u0644\u0629"}
              </span>
              <Badge tone={g.is_active ? "mint" : "moss"}>{g.is_active ? "\u0646\u0634\u0637\u0629" : "\u0645\u0648\u0642\u0641\u0629"}</Badge>
              <button onClick={() => setEditGym(g)} className="btn-ghost rounded-xl px-3.5 py-2 text-[10px] font-bold text-moss hover:text-[var(--brand)] flex items-center gap-1.5">
                <Icon name="palette" className="w-3.5 h-3.5" /> {"\u0627\u0644\u0647\u0648\u064a\u0629"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* create gym modal */}
      {openGym && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpenGym(false)} />
          <div className="relative glass-deep rounded-3xl border border-[var(--glass-border)] w-full max-w-md anim-fade-up p-6">
            <SectionTitle icon="grid" title={"\u0625\u0646\u0634\u0627\u0621 \u0635\u0627\u0644\u0629 \u062c\u062f\u064a\u062f\u0629"} sub={"\u062d\u0635\u0631\u064a \u0628\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629 \u2014 \u0633\u064a\u0623\u062e\u0630 \u0635\u0628 \u062f\u0648\u0645\u064a\u0646 \u0648\u0647\u0648\u064a\u0629 \u0643\u0627\u0645\u0644\u0629"} />
            <div className="grid gap-2.5 mt-4">
              <input value={gf.name} onChange={(e) => setGf((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} placeholder={"\u0627\u0633\u0645 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 *" + " (\u0645\u062b\u0627\u0644: \u062a\u064a\u062a\u0627\u0646 \u062c\u064a\u0645)"} className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <div className="flex items-center gap-2">
                <input dir="ltr" value={gf.slug} onChange={(e) => setGf((f) => ({ ...f, slug: e.target.value }))} placeholder="subdomain" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent flex-1" />
                <span className="text-[10px] text-moss2 whitespace-nowrap" dir="ltr">.fitpro.hftv.qzz.io</span>
              </div>
              <input value={gf.city} onChange={(e) => setGf((f) => ({ ...f, city: e.target.value }))} placeholder={"\u0627\u0644\u0645\u062f\u064a\u0646\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)"} className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <label className="chip rounded-xl p-3 flex items-center gap-3">
                <input type="color" value={gf.primary_color} onChange={(e) => setGf((f) => ({ ...f, primary_color: e.target.value }))} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0" />
                <span className="text-[11px] font-bold text-snow">{"\u0627\u0644\u0644\u0648\u0646 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u0644\u0644\u0647\u0648\u064a\u0629"}</span>
              </label>
              <div className="border-t border-[var(--glass-border)] pt-3 mt-1">
                <div className="text-[10px] font-bold text-moss mb-2">{"\u062d\u0633\u0627\u0628 \u0645\u062f\u064a\u0631 \u0627\u0644\u0635\u0627\u0644\u0629 (\u064a\u064f\u0646\u0634\u0623 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627)"}</div>
                <div className="grid gap-2">
                  <input dir="ltr" value={gf.admin_email} onChange={(e) => setGf((f) => ({ ...f, admin_email: e.target.value }))} placeholder="admin@gym.com" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
                  <input dir="ltr" value={gf.admin_password} onChange={(e) => setGf((f) => ({ ...f, admin_password: e.target.value }))} placeholder={"\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 (\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629: GymAdmin2026!)"} className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2.5">
                <button disabled={busy} onClick={submitGym} className="btn-brand rounded-xl py-3 text-xs font-display font-bold disabled:opacity-60">
                  {busy ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621\u2026" : "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0635\u0627\u0644\u0629"}
                </button>
                <button onClick={() => setOpenGym(false)} className="btn-ghost rounded-xl px-5 py-3 text-xs font-bold text-moss">{"\u0625\u0644\u063a\u0627\u0621"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* create standalone trainer modal */}
      {openTr && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpenTr(false)} />
          <div className="relative glass-deep rounded-3xl border border-[var(--glass-border)] w-full max-w-md anim-fade-up p-6">
            <SectionTitle icon="dumbbell" title={"\u0645\u062f\u0631\u0628 \u0645\u0633\u062a\u0642\u0644"} sub={"\u062a\u0637\u0628\u064a\u0642 \u062e\u0627\u0635 \u0628\u0635\u0628 \u062f\u0648\u0645\u064a\u0646 \u062e\u0627\u0633 \u0628\u0647"} />
            <div className="grid gap-2.5 mt-4">
              <input value={tf.name} onChange={(e) => setTf((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} placeholder={"\u0627\u0633\u0645 \u0627\u0644\u0645\u062f\u0631\u0628 *"} className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <input dir="ltr" value={tf.email} onChange={(e) => setTf((f) => ({ ...f, email: e.target.value }))} placeholder="email@domain.com *" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <div className="flex items-center gap-2">
                <input dir="ltr" value={tf.slug} onChange={(e) => setTf((f) => ({ ...f, slug: e.target.value }))} placeholder="subdomain" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent flex-1" />
                <span className="text-[10px] text-moss2 whitespace-nowrap" dir="ltr">.fitpro.hftv.qzz.io</span>
              </div>
              <input dir="ltr" type="password" value={tf.password} onChange={(e) => setTf((f) => ({ ...f, password: e.target.value }))} placeholder={"\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 (\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629: Trainer2026!)"} className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <div className="grid grid-cols-[1fr_auto] gap-2.5">
                <button disabled={busy} onClick={submitTrainer} className="btn-brand rounded-xl py-3 text-xs font-display font-bold disabled:opacity-60">
                  {busy ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621\u2026" : "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628"}
                </button>
                <button onClick={() => setOpenTr(false)} className="btn-ghost rounded-xl px-5 py-3 text-xs font-bold text-moss">{"\u0625\u0644\u063a\u0627\u0621"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* identity editor modal */}
      {editGym && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditGym(null)} />
          <div className="relative glass-deep rounded-3xl border border-[var(--glass-border)] w-full max-w-lg max-h-[90vh] overflow-y-auto anim-fade-up p-6">
            <SectionTitle icon="palette" title={"\u0647\u0648\u064a\u0629: " + editGym.name} sub={"\u064a\u0637\u0628\u0642 \u0641\u0648\u0631\u064b\u0627 \u0639\u0644\u0649 \u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u0635\u0628 \u062f\u0648\u0645\u064a\u0646"} />
            <div className="mt-4">
              <AppearanceEditor
                initial={{
                  primary_color: editGym.primary_color, accent_color: editGym.accent_color,
                  background_color: editGym.background_color, default_theme: editGym.default_theme,
                  font_family: editGym.font_family, splash_title: editGym.splash_title,
                  splash_tagline: editGym.splash_tagline, splash_style: editGym.splash_style,
                  logo: null, banner: null, background_image: null, splash_image: null,
                }}
                onSave={async (patch) => { await updateGym(editGym.id, patch); await load(); }}
              />
            </div>
            <button onClick={() => setEditGym(null)} className="btn-ghost w-full rounded-xl py-2.5 text-[11px] font-bold text-moss mt-3">{"\u0625\u063a\u0644\u0627\u0642"}</button>
          </div>
        </div>
      )}
    </div>
  );
}


function AccountsTab() {
  const { toast } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<AdminUser | null>(null);
  const [ef, setEf] = useState({ first_name: "", last_name: "", email: "", role: "client", password: "" });
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<AdminUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchUsers(roleF ? `&role=${roleF}` : "");
      setUsers(r.results || []);
    } catch { /* noop */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [roleF]);

  const saveEdit = async () => {
    if (!edit) return;
    setBusy(true);
    try {
      const patch: Record<string, unknown> = {
        first_name: ef.first_name, last_name: ef.last_name, email: ef.email, role: ef.role,
      };
      if (ef.password) patch.password = ef.password;
      await updateUser(edit.id, patch);
      setEdit(null); setEf({ first_name: "", last_name: "", email: "", role: "client", password: "" });
      await load();
      toast("\u062a\\u062d\\u062f\\u064a\\u062b \\u0627\\u0644\\u062d\\u0633\\u0627\\u0628 \\u2713".replace("\\u", "\u062a"), "mint");
    } catch { toast("\u0641\\u0634\\u0644 \\u0627\\u0644\\u062a\\u062d\\u062f\\u064a\\u062b", "ember"); }
    finally { setBusy(false); }
  };

  const toggleActive = async (u: AdminUser) => {
    try { await updateUser(u.id, { is_active: !u.is_active }); await load(); } catch { toast("\\u0641\\u0634\\u0644", "ember"); }
  };

  const hardDelete = async () => {
    if (!confirmDel) return;
    setBusy(true);
    try { await deleteUser(confirmDel.id); setConfirmDel(null); await load(); toast("\\u062d\\u064f\\u0630\\u0641 \\u0646\\u0647\\u0627\\u0626\\u064a\\u064b\\u0627", "ember"); }
    catch { toast("\\u062a\\u0639\\u0630\\u0651\\u0631 \\u0627\\u0644\\u062d\\u0630\\u0641", "ember"); }
    finally { setBusy(false); }
  };

  const ROLE_AR: Record<string, string> = { super_admin: "\\u0645\\u0646\\u0635\\u0629", gym_admin: "\\u0645\\u062f\\u064a\\u0631 \\u0635\\u0627\\u0644\\u0629", trainer: "\\u0645\\u062f\\u0631\\u0628", client: "\\u0645\\u062a\\u062f\\u0631\\u0628" };

  const filtered = users.filter((u) =>
    (u.email + " " + u.first_name + " " + u.last_name).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid gap-5">
      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 chip rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" className="w-4 h-4 text-moss" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="\\u0628\\u062d\\u062b \\u0628\\u0627\\u0644\\u0627\\u0633\\u0645 \\u0623\\u0648 \\u0627\\u0644\\u0628\\u0631\\u064a\\u062f\\u2026" className="bg-transparent outline-none text-xs flex-1 placeholder:text-moss2" />
        </div>
        <select value={roleF} onChange={(e) => setRoleF(e.target.value)} className="chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none bg-transparent">
          <option value="" className="bg-[#121a13]">\\u0643\\u0644 \\u0627\\u0644\\u0623\\u062f\\u0648\\u0627\\u0631</option>
          <option value="super_admin" className="bg-[#121a13]">\\u0645\\u0646\\u0635\\u0629</option>
          <option value="gym_admin" className="bg-[#121a13]">\\u0645\\u062f\\u064a\\u0631 \\u0635\\u0627\\u0644\\u0629</option>
          <option value="trainer" className="bg-[#121a13]">\\u0645\\u062f\\u0631\\u0628</option>
          <option value="client" className="bg-[#121a13]">\\u0645\\u062a\\u062f\\u0631\\u0628</option>
        </select>
      </div>

      {loading ? <div className="panel p-10 text-center text-xs text-moss">{"\\u062c\\u0627\\u0631\\u064a \\u0627\\u0644\\u062a\\u062d\\u0645\\u064a\\u0644\\u2026"}</div> : (
        <div className="grid gap-2.5">
          {filtered.map((u, i) => (
            <div key={u.id} className="glass rounded-2xl p-3.5 flex flex-wrap items-center gap-3 anim-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <span className="w-9 h-9 rounded-xl grid place-items-center font-display font-bold text-xs shrink-0" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                {(u.first_name || u.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-snow truncate">{u.first_name} {u.last_name} {!u.is_active && <span className="text-blush">({"}\\u0645\\u0639\\u0637\\u0644{".replace(/[{}/]/g, "")})</span>}</div>
                <div className="text-[10px] text-moss2 truncate" dir="ltr">{u.email}</div>
              </div>
              <Badge tone={u.role === "super_admin" ? "brand" : u.role === "gym_admin" ? "ember" : "moss"}>{ROLE_AR[u.role]}</Badge>
              <button onClick={() => { setEdit(u); setEf({ first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role, password: "" }); }}
                className="btn-ghost rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-moss hover:text-snow">\\u062a\\u0639\\u062f\\u064a\\u0644</button>
              <button onClick={() => toggleActive(u)} className="btn-ghost rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-moss hover:text-snow">
                {u.is_active ? "\\u062a\\u0639\\u0637\\u064a\\u0644" : "\\u062a\\u0641\\u0639\\u064a\\u0644"}
              </button>
              <button onClick={() => setConfirmDel(u)} className="btn-ghost rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-blush hover:!border-blush/40">\\u062d\\u0630\\u0641</button>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEdit(null)} />
          <div className="relative glass-deep rounded-3xl border border-[var(--glass-border)] w-full max-w-md anim-fade-up p-6">
            <SectionTitle icon="users" title="\\u062a\\u0639\\u062f\\u064a\\u0644 \\u0627\\u0644\\u062d\\u0633\\u0627\\u0628" sub={edit.email} />
            <div className="grid gap-2.5 mt-4">
              <input value={ef.first_name} onChange={(e) => setEf((f) => ({ ...f, first_name: e.target.value }))} placeholder="\\u0627\\u0644\\u0627\\u0633\\u0645 \\u0627\\u0644\\u0623\\u0648\\u0644" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <input value={ef.last_name} onChange={(e) => setEf((f) => ({ ...f, last_name: e.target.value }))} placeholder="\\u0627\\u0644\\u0627\\u0633\\u0645 \\u0627\\u0644\\u0623\\u062e\\u064a\\u0631" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <input dir="ltr" value={ef.email} onChange={(e) => setEf((f) => ({ ...f, email: e.target.value }))} placeholder="email" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <select value={ef.role} onChange={(e) => setEf((f) => ({ ...f, role: e.target.value }))} className="chip rounded-xl px-3 py-3 text-xs text-snow outline-none bg-transparent">
                <option value="client" className="bg-[#121a13]">\\u0645\\u062a\\u062f\\u0631\\u0628</option>
                <option value="trainer" className="bg-[#121a13]">\\u0645\\u062f\\u0631\\u0628</option>
                <option value="gym_admin" className="bg-[#121a13]">\\u0645\\u062f\\u064a\\u0631 \\u0635\\u0627\\u0644\\u0629</option>
                <option value="super_admin" className="bg-[#121a13]">\\u0625\\u062f\\u0627\\u0631\\u0629 \\u0627\\u0644\\u0645\\u0646\\u0635\\u0629</option>
              </select>
              <input dir="ltr" type="password" value={ef.password} onChange={(e) => setEf((f) => ({ ...f, password: e.target.value }))} placeholder="\\u0643\\u0644\\u0645\\u0629 \\u0645\\u0631\\u0648\\u0631 \\u062c\\u062f\\u064a\\u062f\\u0629 (\\u0627\\u062e\\u062a\\u064a\\u0627\\u0631\\u064a)" className="chip rounded-xl px-4 py-3 text-xs text-snow outline-none bg-transparent" />
              <button disabled={busy} onClick={saveEdit} className="btn-brand rounded-xl py-3 text-xs font-display font-bold disabled:opacity-60">
                {busy ? "\\u062c\\u0627\\u0631\\u064a\\u2026" : "\\u062d\\u0641\\u0638 \\u0627\\u0644\\u062a\\u0639\\u062f\\u064a\\u0644\\u0627\\u062a"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
          <div className="relative glass-deep rounded-3xl border border-blush/40 w-full max-w-sm anim-fade-up p-6 text-center">
            <div className="text-blush font-display font-bold text-sm mb-2">\\u062a\\u0623\\u0643\\u064a\\u062f \\u0627\\u0644\\u062d\\u0630\\u0641 \\u0627\\u0644\\u0646\\u0647\\u0627\\u0626\\u064a</div>
            <p className="text-xs text-moss leading-6">\\u0633\\u064a\\u064f\\u062d\\u0630\\u0641 \\u062d\\u0633\\u0627\\u0628 <b className="text-snow" dir="ltr">{confirmDel.email}</b> \\u0648\\u0643\\u0644 \\u0628\\u064a\\u0627\\u0646\\u0627\\u062a\\u0647 \\u0628\\u0634\\u0643\\u0644 \\u0644\\u0627 \\u064a\\u0631\\u062c\\u0639. \\u0647\\u0644 \\u0645\\u062a\\u0623\\u0643\\u062f\\u061f</p>
            <div className="grid gap-2 mt-5">
              <button disabled={busy} onClick={hardDelete} className="rounded-xl py-3 text-xs font-bold bg-blush/20 border border-blush/40 text-blush disabled:opacity-60">
                {busy ? "\\u062c\\u0627\\u0631\\u064a\\u2026" : "\\u0646\\u0639\\u0645\\u060c \\u062d\\u0630\\u0641 \\u0646\\u0647\\u0627\\u0626\\u064a"}
              </button>
              <button onClick={() => setConfirmDel(null)} className="btn-ghost rounded-xl py-3 text-xs font-bold text-moss">\\u0625\\u0644\\u063a\\u0627\\u0621</button>
            </div>
          </div>
        </div>
      )}
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

function PlatformSettings() {
  const { toast, lang } = useApp();
  const L = (o: { ar: string; en: string }) => (lang === "ar" ? o.ar : o.en);
  const inputCls = "w-full chip rounded-xl px-3 py-2.5 text-xs text-snow outline-none focus:border-[var(--brand-line)] bg-transparent transition-colors";
  const [identity, setIdentity] = useState({ name: "FitPro Center", support: "support@fitpro.app", defLang: "ar", currency: "SAR" });
  const [smtp, setSmtp] = useState({ host: "smtp.fitpro.app", port: "587", user: "no-reply@fitpro.app" });
  const [mailing, setMailing] = useState(false);
  const [flags, setFlags] = useState({ maintenance: false, signup: true, autoApprove: false });
  const [limits, setLimits] = useState({ gyms: 10, rate: 300, storage: 100 });
  const [retention, setRetention] = useState("365");
  const sendTest = () => {
    setMailing(true);
    window.setTimeout(() => { setMailing(false); toast(L({ ar: `وصل بريد تجريبي إلى ${smtp.user} عبر ${smtp.host} ✓`, en: `Test email delivered via ${smtp.host} ✓` }), "mint"); }, 1300);
  };
  return (
    <div className="grid gap-5">
      {flags.maintenance && (
        <div className="rounded-[calc(var(--radius)*1px)] border border-ember/50 bg-ember/10 px-5 py-3.5 flex items-center gap-3 anim-fade-up">
          <Icon name="bell" className="w-5 h-5 text-ember shrink-0" />
          <p className="text-xs text-snow leading-5">{L({ ar: "وضع الصيانة مفعل — يرى المديرون فقط المنصة، ويُعرض للأعضاء إشعار «نعود خلال ساعة».", en: "Maintenance mode ON — only admins see the platform; members get a back-in-an-hour notice." })}</p>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-5">
        <Reveal>
          <div className="glass p-5 h-full">
            <SectionTitle icon="grid" title={L({ ar: "هوية المنصة", en: "Platform identity" })} sub={L({ ar: "تظهر لجميع الصالات المشتركة", en: "Visible to every tenant gym" })} />
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "اسم المنصة", en: "Platform name" })}</span>
                <input value={identity.name} onChange={(e) => setIdentity((s) => ({ ...s, name: e.target.value }))} className={inputCls} /></label>
              <label className="block"><span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "بريد الدعم", en: "Support email" })}</span>
                <input dir="ltr" value={identity.support} onChange={(e) => setIdentity((s) => ({ ...s, support: e.target.value }))} className={inputCls} /></label>
              <div><span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "اللغة الافتراضية للصالات الجديدة", en: "Default language for new gyms" })}</span>
                <div className="flex gap-2">
                  {([["ar", "العربية"], ["en", "English"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setIdentity((s) => ({ ...s, defLang: v }))} className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all ${identity.defLang === v ? "tab-active" : "border-[var(--glass-border)] text-moss"}`}>{l}</button>
                  ))}
                </div></div>
              <label className="block"><span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "عملة الفوترة الافتراضية", en: "Default billing currency" })}</span>
                <select value={identity.currency} onChange={(e) => setIdentity((s) => ({ ...s, currency: e.target.value }))} className={inputCls}>
                  {["SAR", "USD", "AED", "EUR"].map((c) => <option key={c} value={c} className="bg-[var(--color-panel)]">{c}</option>)}
                </select></label>
            </div>
            <button onClick={() => toast(L({ ar: "حُفظت هوية المنصة عبر جميع الصالات", en: "Platform identity saved across all tenants" }), "brand")} className="btn-brand rounded-xl px-5 py-2.5 text-xs font-bold mt-4 flex items-center gap-2">
              <Icon name="check" className="w-4 h-4" /> {L({ ar: "حفظ", en: "Save" })}
            </button>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="glass p-5 h-full">
            <SectionTitle icon="bolt" title={L({ ar: "بنية البريد (SMTP)", en: "Email infra (SMTP)" })} sub={L({ ar: "لكل رسائل الترحيب والفواتير والتنبيهات", en: "Powers welcome, invoice & alert emails" })} />
            <div className="grid grid-cols-[1fr_84px] gap-3">
              <label className="block"><span className="text-[11px] font-bold text-moss block mb-1.5">Host</span>
                <input dir="ltr" value={smtp.host} onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))} className={`${inputCls} font-display`} /></label>
              <label className="block"><span className="text-[11px] font-bold text-moss block mb-1.5">Port</span>
                <input dir="ltr" value={smtp.port} onChange={(e) => setSmtp((s) => ({ ...s, port: e.target.value }))} className={`${inputCls} font-display`} /></label>
            </div>
            <label className="block mt-3"><span className="text-[11px] font-bold text-moss block mb-1.5">{L({ ar: "مرسل الرسائل", en: "From address" })}</span>
              <input dir="ltr" value={smtp.user} onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))} className={`${inputCls} font-display`} /></label>
            <button onClick={sendTest} disabled={mailing} className="btn-ghost rounded-xl px-4 py-2.5 text-[11px] font-bold text-moss mt-4 flex items-center gap-2 disabled:opacity-60">
              {mailing ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 anim-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <Icon name="bell" className="w-4 h-4" />}
              {mailing ? L({ ar: "جارٍ الإرسال…", en: "Sending…" }) : L({ ar: "إرسال بريد تجريبي", en: "Send test email" })}
            </button>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="glass p-5">
            <SectionTitle icon="shield" title={L({ ar: "التشغيل والتسجيل", en: "Operations & signup" })} sub={L({ ar: "مفاتيح تحكم فورية في المنصة كلها", en: "Instant switches for the whole platform" })} />
            <div className="space-y-3">
              {([
                ["maintenance", { ar: "وضع الصيانة", en: "Maintenance mode" }, { ar: "إيقاف مؤقت للواجهات العامة", en: "Temporarily halts public surfaces" }, "#FF8A3C"],
                ["signup", { ar: "تسجيل صالات جديدة", en: "New gym signup" }, { ar: "السماح للصالات بالاشتراك الذاتي", en: "Allow gyms to self-onboard" }, "var(--brand)"],
                ["autoApprove", { ar: "اعتماد تلقائي للدعوات", en: "Auto-approve invites" }, { ar: "تجاوز مراجعة فريق المبيعات", en: "Skip sales-team review" }, "#45D6C0"],
              ] as const).map(([k, l, d, tone]) => (
                <div key={k} className="chip rounded-xl p-3.5 flex items-center gap-3">
                  <div className="flex-1"><div className="text-xs font-bold text-snow">{L(l)}</div><div className="text-[10px] text-moss mt-0.5">{L(d)}</div></div>
                  <Switch on={flags[k]} tone={tone} onClick={() => { setFlags((s) => ({ ...s, [k]: !s[k] })); toast(`${L(l)} — ${!flags[k] ? L({ ar: "مفعل", en: "ON" }) : L({ ar: "معطل", en: "OFF" })}`, !flags[k] ? "mint" : "ember"); }} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={160}>
          <div className="glass p-5">
            <SectionTitle icon="target" title={L({ ar: "حدود المنصة", en: "Platform limits" })} sub={L({ ar: "تنطبق على كل صالة حسب باقتها", en: "Applied per gym according to its plan" })} />
            <div className="space-y-4">
              {([
                ["gyms", { ar: "صالات لكل مالك", en: "Gyms per owner" }, 1, 50],
                ["rate", { ar: "طلبات API / دقيقة", en: "API requests / min" }, 60, 1000],
                ["storage", { ar: "تخزين لكل صالة (GB)", en: "Storage per gym (GB)" }, 10, 500],
              ] as const).map(([k, l, min, max]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-bold text-moss">{L(l)}</span>
                  <Stepper value={limits[k]} min={min} max={max} step={k === "gyms" ? 1 : k === "rate" ? 30 : 10} onChange={(n) => setLimits((s) => ({ ...s, [k]: n }))} />
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold text-snow">{L({ ar: "احتفاظ البيانات", en: "Data retention" })}</div>
                  <div className="text-[9px] text-moss mt-0.5">{L({ ar: "حذف تلقائي للسجلات الأقدم", en: "Auto-purge of older records" })}</div>
                </div>
                <select value={retention} onChange={(e) => setRetention(e.target.value)} className="chip rounded-xl px-3 py-2 text-[11px] font-bold text-snow bg-transparent outline-none">
                  {[["90", "90 " + L({ ar: "يوم", en: "days" })], ["365", L({ ar: "سنة", en: "1 year" })], ["730", L({ ar: "سنتان", en: "2 years" })]].map(([v, l]) => <option key={v} value={v} className="bg-[var(--color-panel)]">{l}</option>)}
                </select>
              </div>
              <button
                onClick={() => { downloadCsv([[L({ ar: "الصال", en: "Gym" }), L({ ar: "المدينة", en: "City" }), L({ ar: "الباقة", en: "Plan" }), "MRR", L({ ar: "الأعضاء", en: "Members" })], ...GYMS.map((g) => [g.nameEn, g.city, g.plan, g.mrr, g.members])], "fitpro-platform-gyms.csv"); toast(L({ ar: "نُزّل سجل الصالات للمنظمين (CSV) ✓", en: "Platform gyms ledger exported ✓" }), "mint"); }}
                className="btn-ghost rounded-xl px-4 py-2.5 text-[11px] font-bold text-moss mt-4 flex items-center gap-2"
              >
                <Icon name="edit" className="w-4 h-4" /> {L({ ar: "تصدير سجل الصالات", en: "Export gyms ledger" })}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function SuperAdmin({ tab }: { tab: string }) {
  if (tab === "gyms") return <GymsTable />;
  if (tab === "accounts") return <AccountsTab />;
  if (tab === "system") return <SystemHealth />;
  if (tab === "settings") return <PlatformSettings />;
  return <Overview />;
}
