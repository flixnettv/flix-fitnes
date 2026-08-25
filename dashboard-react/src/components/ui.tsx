import React, { useEffect, useRef, useState } from "react";

/* ============================ ICONS (custom inline SVG) ============================ */
export type IconName =
  | "dumbbell" | "flame" | "users" | "userPlus" | "chart" | "bars" | "apple" | "drop"
  | "calendar" | "settings" | "palette" | "shield" | "bell" | "search" | "logout"
  | "plus" | "minus" | "trash" | "check" | "star" | "clock" | "target" | "home"
  | "grid" | "bolt" | "heart" | "arrow" | "eye" | "edit" | "layers" | "spark" | "camera" | "food";

const P: Record<IconName, React.ReactNode> = {
  dumbbell: <><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /><path d="M2 12h1.5M20.5 12H22" /></>,
  flame: <path d="M12 3s1 2.6 1 4.4c1.6-1 3-3 3-3 2.4 2.7 4 6 4 8.6a6.9 6.9 0 0 1-14 0c0-3.6 2.6-6.4 4-8 0 1.8.8 3 2 3.6C11.6 6.7 12 3 12 3Z" />,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.8a3.2 3.2 0 0 1 0 5.4M17.5 14.9c1.6.8 2.6 2.4 3 4.6" /></>,
  userPlus: <><circle cx="10" cy="8.5" r="3.2" /><path d="M4 19.5c.6-3.2 3-5 6-5 1.4 0 2.7.4 3.8 1.1" /><path d="M18.5 13.5v6M15.5 16.5h6" /></>,
  chart: <><path d="M3.5 20.5h17" /><path d="M5.5 16.5l4-5 3.5 2.5 5.5-7" /><circle cx="18.5" cy="7" r="1.4" /></>,
  bars: <><path d="M4 20.5V13M9.3 20.5V6.5M14.6 20.5v-9M20 20.5V9.5" /></>,
  apple: <><path d="M12 8.5c-1.2-1.4-3.4-1.6-4.9-.2-1.8 1.6-2 4.8-.3 7.8 1.2 2.2 2.9 3.9 4.4 3.9.4 0 .6-.2.8-.2s.4.2.8.2c1.5 0 3.2-1.7 4.4-3.9 1.7-3 1.5-6.2-.3-7.8-1.5-1.4-3.7-1.2-4.9.2Z" /><path d="M12 8.5c0-2 1.2-3.6 3-4" /></>,
  drop: <path d="M12 3.5s6 6.6 6 10.5a6 6 0 0 1-12 0C6 10.1 12 3.5 12 3.5ZM9.5 14a2.5 2.5 0 0 0 2.5 2.5" />,
  calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3.5v4M16 3.5v4M8 14h3M8 17h5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2.2-.9 2.2-2 0-1-.8-1.5-.8-2.5 0-1.1.9-2 2.2-2h1.9c1.7 0 3-1.3 3-3 0-4.2-3.9-7.5-8.5-7.5Z" /><circle cx="8" cy="10" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16" cy="10" r="1" /><circle cx="8.5" cy="14.5" r="1" /></>,
  shield: <><path d="M12 3.5 5 6.2v5.4c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6.2L12 3.5Z" /><path d="m9.2 11.8 2 2 3.8-4.1" /></>,
  bell: <><path d="M12 4a5.5 5.5 0 0 0-5.5 5.5c0 4.6-1.6 6-1.6 6h14.2s-1.6-1.4-1.6-6A5.5 5.5 0 0 0 12 4Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>,
  logout: <><path d="M14.5 8V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v12A2.5 2.5 0 0 0 6 20.5h6A2.5 2.5 0 0 0 14.5 18v-2" /><path d="M9.5 12H21M17.5 8.5 21 12l-3.5 3.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <><path d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" /><path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" /><path d="M10 10.5v6M14 10.5v6" /></>,
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  star: <path d="m12 3.8 2.4 5 5.5.7-4 3.8 1 5.5-4.9-2.7-4.9 2.7 1-5.5-4-3.8 5.5-.7 2.4-5Z" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  home: <><path d="m4 11 8-7 8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  bolt: <path d="M13 3 5 13.5h5L10.5 21 19 10.5h-5.5L13 3Z" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 9 5.5c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6a4.4 4.4 0 0 1 4.5 4.5c0 5.4-7.5 10-7.5 10Z" />,
  arrow: <path d="M15 5.5 8.5 12l6.5 6.5" />,
  eye: <><path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  edit: <><path d="M14.5 5.5 18.5 9.5 8.5 19.5H4.5v-4L14.5 5.5Z" /><path d="m12.5 7.5 4 4" /></>,
  layers: <><path d="m12 3.5 8.5 4.5L12 12.5 3.5 8 12 3.5Z" /><path d="m4.5 12.5 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" /></>,
  spark: <><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" /></>,
  camera: <><rect x="3.5" y="7" width="17" height="13" rx="2.5" /><path d="M8.5 7 10 4.5h4L15.5 7" /><circle cx="12" cy="13.2" r="3.4" /></>,
  food: <><path d="M6 3.5V10a2.5 2.5 0 0 0 2.5 2.5V21" /><path d="M6 3.5V7M9 3.5V7M17.5 3.5c-1.9 1.3-2.8 3.6-2.8 6 0 1.8.9 3 2.8 3v8.5" /></>,
};

export function Icon({ name, className = "w-5 h-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name]}
    </svg>
  );
}

/* ============================ count-up hook ============================ */
export function useCountUp(target: number, duration = 1100, decimals = 0) {
  const [val, setVal] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(parseFloat((target * eased).toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);
  return val;
}

/* ============================ reveal on scroll ============================ */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-in"); obs.disconnect(); } }),
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ============================ badges & misc ============================ */
const TONES: Record<string, string> = {
  brand: "text-[var(--brand)] bg-[var(--brand-soft)] border-[var(--brand-line)]",
  mint: "text-mint bg-mint/10 border-mint/35",
  ember: "text-ember bg-ember/10 border-ember/35",
  blush: "text-blush bg-blush/10 border-blush/35",
  sky: "text-sky2 bg-sky2/10 border-sky2/35",
  moss: "text-moss bg-moss/10 border-moss/30",
};

export function Badge({ tone = "moss", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold leading-5 ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-ember fill-ember" : "text-line2"}`} />
      ))}
      <span className="text-[11px] font-bold text-moss mr-1" dir="rtl">{rating.toFixed(1)}</span>
    </span>
  );
}

export function SectionTitle({ icon, title, sub, action }: { icon?: IconName; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="w-10 h-10 rounded-xl grid place-items-center bg-[var(--brand-soft)] border border-[var(--brand-line)] text-[var(--brand)]">
            <Icon name={icon} className="w-5 h-5" />
          </span>
        )}
        <div>
          <h2 className="font-display font-bold text-lg leading-6 text-snow">{title}</h2>
          {sub && <p className="text-xs text-moss mt-0.5">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size = "md", color }: { name: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const s = size === "sm" ? "w-8 h-8 text-[11px]" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  const c = color ?? "var(--brand)";
  return (
    <span
      className={`${s} rounded-xl grid place-items-center font-display font-bold shrink-0 border`}
      style={{ color: c, background: "color-mix(in srgb, " + c + " 12%, transparent)", borderColor: "color-mix(in srgb, " + c + " 35%, transparent)" }}
    >
      {name.trim().charAt(0)}
    </span>
  );
}

/* ============================ charts (hand-drawn SVG) ============================ */
function toPath(data: number[], w: number, h: number, pad = 6) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (w - pad * 2), pad + (1 - (v - min) / span) * (h - pad * 2)]);
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

export function Sparkline({ data, w = 96, h = 30, color = "var(--brand)" }: { data: number[]; w?: number; h?: number; color?: string }) {
  const d = toPath(data, w, h, 3);
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <path d={`${d} L${w - 3},${h} L3,${h} Z`} fill={color} opacity="0.1" stroke="none" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" className="chart-line" />
    </svg>
  );
}

export function AreaChart({ data, labels, h = 190, unit = "" }: { data: number[]; labels?: string[]; h?: number; unit?: string }) {
  const w = 640;
  const pad = 10;
  const min = Math.min(...data), max = Math.max(...data);
  const d = toPath(data, w, h, pad);
  const last = data[data.length - 1];
  const lastX = w - pad, lastY = pad + (1 - (last - min) / (max - min || 1)) * (h - pad * 2);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible" style={{ height: h }} aria-hidden="true">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--brand)", stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: "var(--brand)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={pad + f * (h - pad * 2)} y2={pad + f * (h - pad * 2)} stroke="var(--color-line)" strokeDasharray="3 6" strokeWidth="1" />
        ))}
        <path d={`${d} L${w - pad},${h - 2} L${pad},${h - 2} Z`} fill="url(#areaGrad)" stroke="none" />
        <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />
        <circle cx={lastX} cy={lastY} r="4.5" fill="var(--color-bg)" stroke="var(--brand)" strokeWidth="2.5" className="live-dot" style={{ animation: "none" }} />
        <text x={lastX - 10} y={lastY - 12} textAnchor="end" fill="var(--brand)" fontSize="13" fontWeight="700" fontFamily="Changa">{last}{unit}</text>
      </svg>
      {labels && (
        <div className="flex justify-between text-[10px] text-moss2 mt-1.5 px-1">
          {labels.map((l, i) => (
            <span key={i}>{i % 2 === 0 || labels.length <= 8 ? l : ""}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Bars({ data, h = 150, unit = "" }: { data: { day: string; v: number }[]; h?: number; unit?: string }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div className="flex items-end gap-2.5 w-full" style={{ height: h }}>
      {data.map((d, i) => {
        const pct = (d.v / max) * 100;
        const isTop = d.v === max;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
            <span className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isTop ? "text-[var(--brand)]" : "text-moss"}`}>{d.v}{unit}</span>
            <div
              className="w-full rounded-t-md bar-grow relative overflow-hidden"
              style={{
                height: `${pct}%`,
                background: isTop ? "linear-gradient(to top, color-mix(in srgb, var(--brand) 55%, transparent), var(--brand))" : "linear-gradient(to top, rgba(47,66,52,0.5), #2f4234)",
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div className="absolute inset-0 bg-[var(--brand)] opacity-0 group-hover:opacity-30 transition-opacity" />
            </div>
            <span className={`text-[10px] ${isTop ? "text-[var(--brand)] font-bold" : "text-moss2"}`}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Donut({ segments, size = 150, thickness = 17, center, sub }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center: string; sub?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-block ring-pop">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={thickness} opacity="0.5" />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const off = -acc;
          acc += len;
          return (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"
              strokeDasharray={`${Math.max(len - 2.5, 1)} ${C - len + 2.5}`} strokeDashoffset={off}
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display font-bold text-xl leading-6 text-snow">{center}</div>
          {sub && <div className="text-[10px] text-moss mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export function Ring({ pct, size = 76, thickness = 7, color = "var(--brand)", label, subLabel }: { pct: number; size?: number; thickness?: number; color?: string; label?: string; subLabel?: string }) {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C - (clamped / 100) * C}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {label && <div className="font-display font-bold text-sm leading-4" style={{ color }}>{label}</div>}
          {subLabel && <div className="text-[9px] text-moss">{subLabel}</div>}
        </div>
      </div>
    </div>
  );
}

export function Meter({ pct, color = "var(--brand)" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--color-line)] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

export function Switch({ on, onClick, tone = "var(--brand)" }: { on: boolean; onClick: () => void; tone?: string }) {
  return (
    <button onClick={onClick} className="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0" style={{ background: on ? tone : "var(--color-line2)", boxShadow: on ? `0 0 14px -4px ${tone}` : "none" }} aria-label="toggle">
      <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-[var(--color-bg)] shadow transition-all duration-300" style={{ insetInlineStart: on ? "calc(100% - 21px)" : "3px" }} />
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1 }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(min, value - step))} className="w-7 h-7 rounded-lg chip grid place-items-center text-moss hover:text-blush hover:!border-blush/50 transition-colors" aria-label="decrease"><Icon name="minus" className="w-3.5 h-3.5" /></button>
      <span className="font-display font-bold text-sm text-snow w-9 text-center">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} className="w-7 h-7 rounded-lg chip grid place-items-center text-moss hover:text-mint hover:!border-mint/50 transition-colors" aria-label="increase"><Icon name="plus" className="w-3.5 h-3.5" /></button>
    </span>
  );
}

export const downloadCsv = (rows: (string | number)[][], filename: string) => {
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 800);
};
