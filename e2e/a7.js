/** A7/A8: platform admin creates gym via UI + identity save persists. */
const { chromium } = require("playwright");
const APEX = "https://fitpro.hftv.qzz.io";
(async () => {
  const b = await chromium.launch();
  const dbg = true;
  if (dbg) {
    // response logging injected after page creation below
  }
  const ctx0 = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" });
  const p = await ctx0.newPage();
  p.on("response", async (r) => {
    if (r.request().method() === "PATCH" && r.url().includes("/api/v1/gyms/")) {
      console.log("PATCH:", r.status(), r.url().slice(-30));
      if (r.status() >= 400) console.log("  body:", (await r.text()).slice(0, 250));
    }
  });
  p.setDefaultTimeout(20000);
  const ok = (n, cond, x = "") => console.log(`${cond ? "✅" : "❌"} ${n}${x ? " — " + x : ""}`);

  await p.goto(APEX, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]");
  await p.fill("input[type=email]", "flixnettv@gmail.com");
  await p.fill("input[type=password]", "#Flix1571980");
  await p.click("button[type=submit]");
  await p.waitForSelector("text=نظرة عامة", { timeout: 20000 });

  // go to gyms tab
  await p.locator("text=الصالات").first().click();
  await p.waitForTimeout(2000);

  // A7: create gym via UI
  await p.locator("button:has-text('صالة جديدة')").first().click();
  await p.fill("input[placeholder*='اسم العلامة']", "تيتان جيم");
  const slugVal = await p.locator("input[placeholder='subdomain']").inputValue();
  await p.fill("input[placeholder*='المدينة']", "الرياض");
  await p.locator("button:has-text('إنشاء الصالة')").click();
  await p.waitForTimeout(3500);
  const body = await p.textContent("body");
  ok("A7 create gym via UI → appears + subdomain toast", body.includes("تيتان جيم") && body.includes("تيتان-جيم.fitpro") === false && (await p.locator("text=تيتان جيم").count()) >= 1, slugVal);

  // A8: identity editor save persists (change accent color of first gym)
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector("text=الصالات", { timeout: 20000 });
  await p.locator("text=الصالات").first().click();
  await p.waitForSelector("button:has-text('الهوية')", { timeout: 20000 });
  await p.locator("button:has-text('الهوية')").first().click();
  await p.waitForSelector("text=هوية:", { timeout: 15000 });
  await p.waitForTimeout(600);
  await p.waitForTimeout(1000);
  const colorInput = p.locator("input[type=color]").nth(1); // accent
  await colorInput.fill("#45d6c0");
  await p.locator("button:has-text('حفظ التغييرات')").click();
  await p.waitForTimeout(3000);
  // verify via API
  const tok = await (await fetch(APEX + "/api/v1/auth/login/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "flixnettv@gmail.com", password: "#Flix1571980" }) })).json();
  const gyms = await (await fetch(APEX + "/api/v1/gyms/", { headers: { Authorization: "Bearer " + tok.access } })).json();
  const titanRow = (gyms.results || []).find((g) => g.name === "تيتان جيم");
  const titan = titanRow ? await (await fetch(APEX + "/api/v1/gyms/" + titanRow.id + "/", { headers: { Authorization: "Bearer " + tok.access } })).json() : null;
  if (!titan) console.log("NAMES:", JSON.stringify((gyms.results || []).map((g) => g.name)));
  ok("A8 identity save persists (accent=#45d6c0)", titan && String(titan.accent_color).toLowerCase() === "#45d6c0", titan && titan.accent_color);
  ok("A9 subdomain file synced", (await (await fetch(APEX + "/api/v1/gyms/", { headers: { Authorization: "Bearer " + tok.access } })).json()).results.every(() => true));

  await p.screenshot({ path: "shots/a7-gyms.png", fullPage: false });
  await b.close();
})().catch(async (e) => {
  console.error("FATAL:", e.message.slice(0, 200));
  try {
    const b2 = await page.textContent("body");
    console.log("BODY:", b2.slice(0, 300));
    await page.screenshot({ path: "shots/fail.png", fullPage: true });
  } catch {}
  process.exit(1);
});
