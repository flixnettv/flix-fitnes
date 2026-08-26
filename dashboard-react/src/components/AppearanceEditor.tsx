import { useRef, useState } from "react";
import { Icon } from "./ui";
import { useApp } from "../store";

export interface AppearanceInitial {
  primary_color: string;
  accent_color: string;
  background_color: string;
  default_theme: string;
  font_family: string;
  splash_title: string;
  splash_tagline: string;
  splash_style: string;
  logo: string | null;
  banner: string | null;
  background_image: string | null;
  splash_image: string | null;
}

const FONTS = ["Cairo", "Tajawal", "Changa", "IBM Plex Sans Arabic", "Space Grotesk"];
const COLORS: [string, string][] = [
  ["primary_color", "اللون الأساسي"],
  ["accent_color", "اللون المميز"],
  ["background_color", "لون الخلفية"],
];

function ImageSlot({ label, value, onChange }: { label: string; value: string | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  return (
    <div className="chip rounded-xl p-3">
      <div className="text-[10px] font-bold text-moss mb-2">{label}</div>
      <div className="flex items-center gap-2.5">
        <div className="w-14 h-14 rounded-lg bg-black/30 border border-line grid place-items-center overflow-hidden shrink-0">
          {preview ? <img src={preview} alt={label} className="w-full h-full object-cover" /> : <Icon name="grid" className="w-5 h-5 text-moss2" />}
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <button type="button" onClick={() => ref.current?.click()} className="btn-ghost rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-moss hover:text-snow">
            {preview ? "تغيير" : "رفع صورة"}
          </button>
          {preview && (
            <button type="button" onClick={() => { setPreview(null); onChange(null); }} className="text-[10px] font-bold text-blush hover:underline text-start">
              إزالة
            </button>
          )}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPreview(URL.createObjectURL(f)); onChange(f); } }} />
    </div>
  );
}

export default function AppearanceEditor({ initial, onSave }: {
  initial: AppearanceInitial;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const { toast } = useApp();
  const [form, setForm] = useState({
    primary_color: initial.primary_color,
    accent_color: initial.accent_color,
    background_color: initial.background_color,
    default_theme: initial.default_theme || "dark",
    font_family: initial.font_family || "Cairo",
    splash_title: initial.splash_title || "",
    splash_tagline: initial.splash_tagline || "",
    splash_style: initial.splash_style || "gradient",
  });
  const [images, setImages] = useState<Record<string, File | null | undefined>>({
    logo: undefined, banner: undefined, background_image: undefined, splash_image: undefined,
  });
  const [previews] = useState<Record<string, string | null>>({
    logo: initial.logo, banner: initial.banner,
    background_image: initial.background_image, splash_image: initial.splash_image,
  });
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setImage = (k: string, f: File | null) => setImages((im) => ({ ...im, [k]: f }));

  const save = async () => {
    setBusy(true);
    try {
      const patch: Record<string, unknown> = { ...form };
      for (const [k, v] of Object.entries(images)) {
        if (v !== undefined) patch[k] = v; // File or null (clear)
      }
      await onSave(patch);
      toast("تم الحفظ ✓ — حدّث الصفحة لرؤية كل التأثيرات", "mint");
    } catch {
      toast("تعذّر الحفظ — تحقق من القيم", "ember");
    } finally { setBusy(false); }
  };

  const imgLabels: [string, string][] = [
    ["logo", "الشعار"],
    ["banner", "البانر"],
    ["background_image", "صورة الخلفية"],
    ["splash_image", "خلفية شاشة البداية"],
  ];

  return (
    <div className="grid gap-4">
      {/* colors */}
      <div className="grid sm:grid-cols-3 gap-3">
        {COLORS.map(([k, label]) => (
          <label key={k} className="chip rounded-xl p-3 flex items-center gap-3">
            <input type="color" value={form[k]} onChange={(e) => set(k, e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0" />
            <span className="text-[11px] font-bold text-snow">{label}</span>
            <span className="ms-auto text-[10px] text-moss2 font-display" dir="ltr">{form[k]}</span>
          </label>
        ))}
      </div>

      {/* theme + font */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="chip rounded-xl p-3">
          <div className="text-[10px] font-bold text-moss mb-2">الوضع الافتراضي</div>
          <div className="flex gap-1.5">
            {([["dark", "ليلي"], ["light", "نهاري"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set("default_theme", v)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${form.default_theme === v ? "tab-active" : "border-line text-moss hover:text-snow"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <label className="chip rounded-xl p-3 block">
          <div className="text-[10px] font-bold text-moss mb-2">الخط</div>
          <select value={form.font_family} onChange={(e) => set("font_family", e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-snow">
            {FONTS.map((f) => <option key={f} value={f} className="bg-[#121a13]">{f}</option>)}
          </select>
        </label>
      </div>

      {/* splash */}
      <div className="chip rounded-xl p-4 grid gap-2.5">
        <div className="text-[10px] font-bold text-moss">شاشة البداية</div>
        <input value={form.splash_title} onChange={(e) => set("splash_title", e.target.value)}
          placeholder="العنوان الرئيسي" className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-black/25 border border-line text-snow outline-none focus:border-[var(--brand-line)] bg-transparent" />
        <input value={form.splash_tagline} onChange={(e) => set("splash_tagline", e.target.value)}
          placeholder="النص التعريفي" className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-black/25 border border-line text-snow outline-none focus:border-[var(--brand-line)] bg-transparent" />
        <div className="flex gap-1.5">
          {([["gradient", "متدرج"], ["solid", "صريح"], ["minimal", "بسيط"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => set("splash_style", v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${form.splash_style === v ? "tab-active" : "border-line text-moss hover:text-snow"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* images */}
      <div className="grid sm:grid-cols-2 gap-3">
        {imgLabels.map(([k, label]) => (
          <ImageSlot key={k} label={label} value={previews[k]} onChange={(f) => setImage(k, f)} />
        ))}
      </div>

      <button type="button" disabled={busy} onClick={save}
        className="btn-brand rounded-xl py-3 text-xs font-display font-bold disabled:opacity-60 flex items-center justify-center gap-2">
        {busy ? "جاري الحفظ…" : <><Icon name="check" className="w-4 h-4" /> حفظ التغييرات</>}
      </button>
    </div>
  );
}
