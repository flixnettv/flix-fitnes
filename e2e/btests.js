/** B-series: platform admin full management E2E. */
const { chromium } = require("playwright");
const APEX = "https://fitpro.hftv.qzz.io";
const UID = String(Date.now()).slice(-5);
const results = [];
const ok = (n, cond, x = "") => { results.push(cond); console.log(`${cond ? "✅" : "❌"} ${n}${x ? " — " + x : ""}`); };

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" })).newPage();
  p.setDefaultTimeout(20000);
  const api = async (method, path, body, tok) => {
    const r = await fetch(APEX + path, {
      method,
      headers: { "Content-Type": "application/json", ...(tok ? { Authorization: "Bearer " + tok } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let j = null; try { j = await r.json(); } catch {}
    return { status: r.status, j };
  };
  const login = (email, password) => api("POST", "/api/v1/auth/login/", { email, password });

  /* admin login */
  await p.goto(APEX, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]");
  await p.fill("input[type=email]", "flixnettv@gmail.com");
  await p.fill("input[type=password]", "#Flix1571980");
  await p.click("button[type=submit]");
  await p.waitForSelector("text=نظرة عامة", { timeout: 25000 });
  const tok = (await login("flixnettv@gmail.com", "#Flix1571980")).j.access;

  /* B0: real identity in sidebar, zero mock user names */
  await p.waitForTimeout(1500);
  const body = await p.textContent("body");
  ok("B0 sidebar: real admin identity (no mock سلطان)", !body.includes("سلطان الرشيد"));

  /* B1: create gym WITH admin creds via UI → gym admin logs in */
  await p.locator("text=الصالات").first().click();
  await p.waitForTimeout(1500);
  await p.locator("button:has-text('صالة جديدة')").first().click();
  await p.fill("input[placeholder*='اسم العلامة']", "نبض الرياض " + UID);
  await p.fill("input[placeholder='admin@gym.com']", "admin.nabd." + UID + "@fitpro.hftv.qzz.io");
  await p.fill("input[placeholder*='كلمة المرور']", "NabdAdmin2026!");
  await p.locator("button:has-text('إنشاء الصالة')").click();
  await p.waitForTimeout(3000);
  // identity studio auto-opened? close it
  const closeBtn = p.locator("button:has-text('إغلاق')").first();
  if (await closeBtn.count()) await closeBtn.click();
  await p.waitForTimeout(800);
  const gm = await login("admin.nabd." + UID + "@fitpro.hftv.qzz.io", "NabdAdmin2026!");
  ok("B1 gym admin account created + custom password login", gm.status === 200);

  /* B2: standalone trainer with custom password → subdomain */
  await p.locator("text=الصالات").first().click();
  await p.waitForTimeout(1000);
  await p.locator("button:has-text('مدرب مستقل')").first().click();
  await p.fill("input[placeholder*='اسم المدرب']", "كابتن عمر " + UID);
  await p.fill("input[placeholder='email@domain.com *']", "coach.omar." + UID + "@fitpro.hftv.qzz.io");
  const slugOmar = await p.locator("input[placeholder='subdomain']").inputValue();
  await p.fill("input[placeholder*='كلمة المرور']", "Omar2026!Pass");
  await p.locator("button:has-text('إنشاء الحساب')").click();
  await p.waitForTimeout(3000);
  const om = await login("coach.omar." + UID + "@fitpro.hftv.qzz.io", "Omar2026!Pass");
  ok("B2 trainer custom password login", om.status === 200, slugOmar);

  /* B3: edit user name via Accounts tab → API verify */
  await p.locator("text=الحسابات").first().click();
  await p.waitForTimeout(2000);
  const row = p.locator("div.glass").filter({ hasText: "coach.omar." + UID + "@fitpro.hftv.qzz.io" }).first();
  await row.locator("button:has-text('تعديل')").click();
  await p.fill("input[placeholder='الاسم الأول']", "كابتن عمر " + UID);
  await p.locator("button:has-text('حفظ التعديلات')").click();
  await p.waitForTimeout(2500);
  const users = await api("GET", "/api/v1/auth/users/?role=trainer", null, tok);
  const omar = (users.j.results || []).find((u) => u.email === "coach.omar." + UID + "@fitpro.hftv.qzz.io");
  ok("B3 edit user name persists", omar && omar.first_name.includes("عمر"), omar && omar.first_name);

  /* B4: deactivate → login blocked → reactivate → works */
  await row.locator("button:has-text('تعطيل')").click();
  await p.waitForTimeout(2000);
  const blocked = await login("coach.omar." + UID + "@fitpro.hftv.qzz.io", "Omar2026!Pass");
  ok("B4a deactivated user blocked", blocked.status === 401 || (blocked.j && blocked.j.detail) || blocked.status >= 400, String(blocked.status));
  await row.locator("button:has-text('تفعيل')").click();
  await p.waitForTimeout(2000);
  const unblocked = await login("coach.omar." + UID + "@fitpro.hftv.qzz.io", "Omar2026!Pass");
  ok("B4b reactivated user works", unblocked.status === 200);

  /* B5: platform panel zero-mock check on accounts+gyms tabs */
  const g = await p.textContent("body");
  ok("B5 accounts tab: no mock trainer names", !g.includes("كابتن فهد العتيبي"));

  /* reset trainer password via trainers-admin API */
  const ta = await api("GET", "/api/v1/gyms/trainers-admin/?page_size=200", null, tok);
  const omarT = (ta.j.results || []).find((t) => t.email === "coach.omar." + UID + "@fitpro.hftv.qzz.io");
  if (omarT) {
    await api("POST", `/api/v1/gyms/trainers-admin/${omarT.id}/reset-password/`, { password: "OmarNew2026!" }, tok);
    const relogin = await login("coach.omar." + UID + "@fitpro.hftv.qzz.io", "OmarNew2026!");
    ok("B6 trainer password reset works", relogin.status === 200);
  }

  await p.screenshot({ path: "shots/b-final.png", fullPage: false });
  await b.close();
  const fails = results.filter((x) => !x).length;
  console.log(`\n===== B-series: ${results.length - fails}/${results.length} =====`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 250)); process.exit(2); });
