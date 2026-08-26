import { useApp } from "../store";

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5Z" />
  </svg>
);


export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, toast, t } = useApp();
  return (
    <div className="flex items-center chip rounded-full p-1 gap-0.5" role="group" aria-label="language">
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => { if (lang !== l) { setLang(l); toast(t("toast.lang"), "mint"); } }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${lang === l ? "bg-[var(--brand)] text-[#0b110d] shadow-[0_4px_14px_-4px_var(--brand-line)]" : "text-moss hover:text-snow"}`}
        >
          {l === "ar" ? "عربي" : "EN"}
        </button>
      ))}
      {!compact && <span className="px-1.5 text-moss2 hidden sm:grid place-items-center"><GlobeIcon className="w-3.5 h-3.5" /></span>}
    </div>
  );
}
