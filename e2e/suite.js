/**
 * FitPro E2E — browser test suite (qa-lead)
 * Covers: branded subdomain login isolation, apex platform login,
 * per-client plan write, client check-in write, guards.
 */
const { chromium } = require("playwright");

const APEX = "https://fitpro.hftv.qzz.io";
const SARA = "https://sara-pro.fitpro.hftv.qzz.io";
const results = [];
const shot = (n) => `/home/flix/fitpro-center/e2e/shots/${n}.png`;

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" });
  const page = await ctx.newPage();
  const check = (name, ok, extra = "") => {
    results.push([ok ? "PASS" : "FAIL", name, extra]);
    console.log(`${ok ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
  };

  /* ---------- 1. SUBDOMAIN: closed branded login ---------- */
  await page.goto(SARA, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);
  const bodyText = await page.textContent("body");
  check("T1 subdomain: login form present", await page.locator("input[type=email]").count() === 1);
  check("T2 subdomain: NO gym switcher", !bodyText.includes("تيتان جيم") && !(await page.locator("text=تيتان جيم").count()));
  check("T3 subdomain: NO demo portals", !bodyText.includes("تجربة بوابة") && !bodyText.includes("أربع لوحات"));
  const brandTitle = await page.locator("h1").first().textContent().catch(() => "");
  check("T4 subdomain: branded splash title", (brandTitle || "").includes("كوتش سارة"), brandTitle?.trim());
  const brandVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim());
  check("T5 subdomain: brand color applied (#7FB4FF)", brandVar.toLowerCase() === "#7fb4ff", brandVar);
  await page.screenshot({ path: shot("t1-sara-login"), fullPage: false });

  /* ---------- 2. SUBDOMAIN login works (sara trainer) ---------- */
  await page.fill("input[type=email]", "coach.sara@fitpro.hftv.qzz.io");
  await page.fill("input[type=password]", "Trainer2026!");
  await page.click("button[type=submit]");
  let loggedIn = false;
  try { await page.waitForSelector("text=متدربوني", { timeout: 15000 }); loggedIn = true; } catch {}
  check("T6 subdomain: login → dashboard", loggedIn);
  await page.screenshot({ path: shot("t2-sara-dash") });
  await page.evaluate(() => localStorage.clear());
  await ctx.clearCookies();

  /* ---------- 3. APEX: platform login + marketing ---------- */
  await page.goto(APEX, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);
  const apexText = await page.textContent("body");
  check("A1 apex: tenant picker visible", apexText.includes("تيتان جيم") || apexText.includes("القمة"));
  check("A2 apex: NO demo portals (removed)", !apexText.includes("تجربة بوابة"));
  check("A3 apex: real login form", await page.locator("input[type=email]").count() === 1);

  // trainer login on apex
  await page.fill("input[type=email]", "trainer@fitpro.hftv.qzz.io");
  await page.fill("input[type=password]", "Trainer2026!");
  await page.click("button[type=submit]");
  await page.waitForTimeout(3500);
  check("A4 apex: trainer login → app", (await page.textContent("body")).length > 200 && !(await page.locator("input[type=password]").count()));
  await page.screenshot({ path: shot("a1-apex-trainer") });

  /* ---------- 4. TRAINER: per-client workout plan WRITE ---------- */
  // go to builder tab
  try {
    await page.waitForSelector("text=باني التمرين", { timeout: 15000 });
    await page.locator("text=باني التمرين").first().click();
    await page.waitForSelector("select", { timeout: 15000 });
  } catch { console.log("⚠ nav wait fallback"); }
  // client selector exists?
  const sel = page.locator("select").first();
  check("W1 builder: client selector present", (await sel.count()) > 0);
  if (await sel.count()) {
    await sel.selectOption({ index: 1 });
    await page.waitForTimeout(2000);
    let saveVisible = false;
    try { await page.waitForSelector("button:has-text('حفظ')", { timeout: 10000 }); saveVisible = true; } catch {}
    check("W2 builder: save button present", saveVisible);
    if (saveVisible) {
      await page.locator("button:has-text('حفظ')").first().click();
      await page.waitForTimeout(3500);
      const toastOrBody = await page.textContent("body");
      check("W3 builder: plan saved ✓", toastOrBody.includes("✓"), "write-op");
    }
  }
  await page.screenshot({ path: shot("w1-builder"), fullPage: false });
  await page.evaluate(() => localStorage.clear());
  await ctx.clearCookies();

  /* ---------- 5. CLIENT: check-in WRITE ---------- */
  // pick a fresh client (no check-in this week) using trainer API
  const tt = await (await fetch(APEX + "/api/v1/auth/login/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "trainer@fitpro.hftv.qzz.io", password: "Trainer2026!" }) })).json();
  const mh = { Authorization: "Bearer " + tt.access, "Content-Type": "application/json" };
  const members = await (await fetch(APEX + "/api/v1/gyms/members/", { headers: mh })).json();
  const checkins = await (await fetch(APEX + "/api/v1/progress/checkins/", { headers: mh })).json();
  const weekSet = new Set((checkins.results || checkins).map((x) => x.client));
  const fresh = members.find((m) => !weekSet.has(m.id)) || members[members.length - 1];
  const freshEmail = fresh.email;
  console.log("   fresh client for check-in:", freshEmail);

  await page.goto(APEX, { waitUntil: "networkidle" });
  await page.fill("input[type=email]", freshEmail);
  await page.fill("input[type=password]", "Client2026!");
  await page.click("button[type=submit]");
  await page.waitForTimeout(3500);
  const checkinBtn = page.locator("button, a").filter({ hasText: "تسجيل" }).first();
  if (await checkinBtn.count()) { await checkinBtn.click(); await page.waitForTimeout(1500); }
  const sendBtn = page.locator("button").filter({ hasText: /إرسال/ }).first();
  check("C1 client: check-in send present", (await sendBtn.count()) > 0);
  if (await sendBtn.count()) {
    await sendBtn.click();
    await page.waitForTimeout(3000);
    const b = await page.textContent("body");
    check("C2 client: check-in sent ✓", b.includes("وصل") || b.includes("✓"), "write-op");
  }
  await page.screenshot({ path: shot("c1-checkin") });

  /* ---------- 6. Guard: client cannot see admin tabs ---------- */
  const adminLeak = await page.locator("text=الأعضاء").count();
  check("G1 client: no admin members tab", adminLeak === 0);


  /* ---------- 7. PLATFORM ADMIN (flixnettv) ---------- */
  await page.evaluate(() => localStorage.clear());
  await ctx.clearCookies();
  await page.goto(APEX, { waitUntil: "networkidle" });
  await page.fill("input[type=email]", "flixnettv@gmail.com");
  await page.fill("input[type=password]", "#Flix1571980");
  await page.click("button[type=submit]");
  let adminOk = false;
  try {
    await page.waitForSelector("text=نظرة عامة", { timeout: 15000 });
    adminOk = true;
  } catch {}
  check("A5 platform-admin: login → overview", adminOk);
  await page.waitForTimeout(1500);
  const ab = await page.textContent("body");
  check("A6 platform-admin: tenant picker + real gyms", ab.includes("تيتان جيم") && ab.includes("FitPro Demo Gym"));
  await page.screenshot({ path: shot("a5-flixnettv") });

  await browser.close();

  const fails = results.filter((r) => r[0] === "FAIL").length;
  console.log(`\n===== ${results.length - fails}/${results.length} PASSED =====`);
  process.exit(fails ? 1 : 0);
}

run().catch((e) => { console.error("SUITE ERROR:", e.message); process.exit(2); });
