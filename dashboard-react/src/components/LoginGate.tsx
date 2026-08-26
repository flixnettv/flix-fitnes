import { useEffect, useState } from "react";
import { GYMS } from "../data";
import { useApp } from "../store";
import { Icon, useCountUp } from "./ui";

/**
 * Login gate — two exclusive variants:
 *  • Apex (platform admin domain): full marketing + tenant switcher + real login.
 *  • Tenant subdomain: ONLY the account's branded login (logo/colors/splash).
 * Demo role-portals removed everywhere.
 */

const APEX_HOST = "fitpro.hftv.qzz.io";
export const isApex = () => {
  const h = window.location.hostname.toLowerCase();
  return h === APEX_HOST || h === "www." + APEX_HOST;
};

/* ---------------- shared real-login form ---------------- */
function RealLoginForm({ compact = false }: { compact?: boolean }) {
  const { realLogin, authBusy, authError, toast, t } = useApp();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitErr(null);
    if (!email.trim() || !pass) { setSubmitErr("أدخل البريد وكلمة المرور"); return; }
    const ok = await realLogin(email.trim(), pass);
    if (ok) toast(t("toast.welcome"), "mint");
    else setSubmitErr(authError || "فشل تسجيل الدخول");
  };

  return (
    <form onSubmit={submit} className={compact ? "grid gap-2.5" : "glass panel-hover p-5 grid gap-2.5"}>
      {!compact && (
        <div className="flex items-center gap-2 mb-1">
          <span className="w-9 h-9 rounded-xl grid place-items-center border" style={{ background: "var(--brand-soft)", borderColor: "var(--brand-line)", color: "var(--brand)" }}>
            <Icon name="shield" className="w-4.5 h-4.5" />
          </span>
          <div>
            <div className="font-display font-bold text-snow text-sm">الدخول بحسابك</div>
            <div className="text-[10px] text-moss">بيانات مباشرة — متصل بالمنصة</div>
          </div>
        </div>
      )}
      <input
        dir="ltr" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)}
        placeholder="البريد الإلكتروني" autoComplete="username"
        className="w-full rounded-xl px-4 py-3 text-[13px] bg-black/25 border border-[var(--glass-border)] text-snow placeholder:text-moss2 outline-none focus:border-[var(--brand-line)] transition-colors"
      />
      <input
        dir="ltr" type="password" value={pass} onChange={(ev) => setPass(ev.target.value)}
        placeholder="كلمة المرور" autoComplete="current-password"
        className="w-full rounded-xl px-4 py-3 text-[13px] bg-black/25 border border-[var(--glass-border)] text-snow placeholder:text-moss2 outline-none focus:border-[var(--brand-line)] transition-colors"
      />
      {(submitErr || authError) && (
        <div className="text-[11px] font-bold text-ember bg-ember/10 border border-ember/30 rounded-lg px-3 py-2">
          {submitErr || authError}
        </div>
      )}
      <button type="submit" disabled={authBusy}
        className="btn-brand w-full rounded-xl py-3 text-[13px] font-display font-bold flex items-center justify-center gap-2 disabled:opacity-60">
        {authBusy
          ? <><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> جاري الدخول…</>
          : <><Icon name="arrow" className="w-4 h-4" /> تسجيل الدخول</>}
      </button>
    </form>
  );
}

/* ---------------- tenant (subdomain) login ---------------- */
function TenantLogin() {
  const { brand } = useApp();
  const style = (brand as unknown as { welcome?: string }).welcome;

  const bg = (() => {
    if (style === "solid") return `linear-gradient(160deg, var(--brand), color-mix(in srgb, var(--brand) 78%, black))`;
    if (style === "minimal") return "radial-gradient(900px 480px at 50% -10%, rgba(255,255,255,.06), transparent), #0b0f0c";
    return `radial-gradient(1100px 520px at 80% -10%, color-mix(in srgb, var(--brand) 26%, transparent), transparent), linear-gradient(150deg, #0b110d 30%, color-mix(in srgb, var(--brand) 16%, #0b110d))`;
  })();

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: bg }}>
      <div className="flex-1 grid place-items-center px-5 py-12">
        <div className="w-full max-w-sm anim-fade-up text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl grid place-items-center overflow-hidden shadow-[0_18px_50px_-12px_var(--brand-line)]"
               style={{ background: brand.accent, color: "#0b110d" }}>
            {brand.logoUrl
              ? <img src={brand.logoUrl} alt="logo" className="w-full h-full object-cover" />
              : <span className="font-display font-extrabold text-3xl">{brand.initial}</span>}
          </div>

          <h1 className="font-display font-extrabold text-2xl text-snow mt-5 leading-9">
            {brand.welcome || brand.nameAr}
          </h1>
          {brand.welcome && (
            <div className="text-[12px] font-bold mt-1" style={{ color: "var(--brand)" }}>{brand.nameAr}</div>
          )}

          <div className="mt-7 text-right">
            <RealLoginForm />
          </div>

          <p className="text-[10px] text-moss2 mt-5">
            تطبيق <b className="text-moss">{brand.nameAr}</b> — جميع البيانات محمية ومشفّرة
          </p>
        </div>
      </div>
      <div className="pb-6 text-center text-[10px] text-moss2 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--brand)" }} />
        Powered by FitPro Center
      </div>
    </div>
  );
}

/* ---------------- apex (platform) login ---------------- */
function ApexLogin() {
  const { setGym, gymId, brand, lang, firstVisit: fv, dismissFirstVisit, setLang, t, loc } = useApp();
  const gymsCount = useCountUp(GYMS.length, 700);
  const members = useCountUp(2683, 1300);

  return (
    <div className="min-h-screen relative z-10 grid lg:grid-cols-2">
      {/* ====== marketing side (apex only) ====== */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-e border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl grid place-items-center font-display font-extrabold text-lg"
                  style={{ background: "var(--brand)", color: "#0b110d" }}>F</span>
            <div>
              <div className="font-display font-extrabold text-lg text-snow">FitPro Center</div>
              <div className="text-[10px] text-moss">منصة إدارة الصالات الرياضية</div>
            </div>
          </div>

          <h1 className="font-display font-extrabold text-4xl leading-[1.25] text-snow mt-16">
            {t("login.h1a")}<br />
            <span style={{ color: "var(--brand)" }}>{t("login.h1b")}</span>
          </h1>
          <p className="text-moss text-sm leading-7 mt-6 max-w-md">{t("login.desc")}</p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-moss mt-8">
            <Icon name="palette" className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
            {t("login.tenant")} — <span className="text-moss2">{t("login.tenantSub")}</span>
          </div>
        </div>

        {/* live tenant switcher preview */}
        <div>
          <div className="text-[11px] font-bold text-moss mb-3">{t("login.pickGym")}</div>
          <div className="grid gap-2 max-w-md">
            {GYMS.slice(0, 5).map((g, i) => (
              <button key={g.id} onClick={() => setGym(g.id)}
                className={`anim-fade-up text-start glass rounded-2xl px-4 py-3 flex items-center gap-3 transition-all ${g.id === gymId ? "!border-[var(--brand-line)] bg-[var(--brand-soft)]" : "panel-hover"}`}
                style={{ animationDelay: `${i * 60}ms` }}>
                <span className="w-9 h-9 rounded-xl grid place-items-center font-display font-bold text-xs shrink-0"
                      style={{ background: g.accent, color: "#0b110d" }}>{g.initial}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-snow truncate">{loc(g)}</span>
                  <span className="block text-[9px] text-moss2">{g.city} · {g.plan}</span>
                </span>
                {g.id === gymId && <Icon name="check" className="w-4 h-4" style={{ color: "var(--brand)" }} />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 max-w-md">
            {[
              [t("login.gymsOn"), String(gymsCount)],
              [t("login.membersOn"), members.toLocaleString("en-US")],
              [t("login.growthLine"), "+18%"],
            ].map(([k, v]) => (
              <div key={k} className="glass rounded-xl p-3 text-center">
                <div className="font-display font-extrabold text-lg text-snow" dir="ltr">{v}</div>
                <div className="text-[9px] text-moss2 mt-0.5">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== portals side ====== */}
      <div className="flex flex-col justify-center items-center gap-8 px-6 lg:px-12 py-10">
        <div className="w-full max-w-md">
          <div className="mb-5">
            <h2 className="font-display font-bold text-2xl text-snow">
              {brand.welcome || t("login.choosePortal")}
            </h2>
            <p className="text-xs text-moss mt-1.5">
              {brand.welcome ? `${loc(brand)} — بوابة إدارة المنصة` : t("login.sub")}
            </p>
          </div>

          <RealLoginForm />

          <p className="text-[10px] text-moss2 mt-6 leading-5">{t("login.note")}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginGate() {
  const apex = isApex();
  return apex ? <ApexLogin /> : <TenantLogin />;
}
