const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" })).newPage();
  p.setDefaultTimeout(20000);
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message.slice(0, 300)));
  p.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().split("/io")[1] || r.url().slice(-40)); });
  p.on("console", (m) => { if (m.type() === "error") console.log("[console]", m.text().slice(0, 150)); });

  await p.goto("https://sara-pro.fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]", { timeout: 20000 });
  await p.fill("input[type=email]", "coach.sara@fitpro.hftv.qzz.io");
  await p.fill("input[type=password]", "Trainer2026!");
  await p.click("button[type=submit]");
  await p.waitForTimeout(12000);
  const body = await p.textContent("body");
  console.log("--- body snippet ---");
  console.log(body.slice(0, 250));
  console.log("--- still login form?", await p.locator("input[type=password]").count());
  if (errs.length) console.log("ERRS:\n" + errs.join("\n")); else console.log("no pageerrors");
  await p.screenshot({ path: "shots/dbg7-sara.png", fullPage: true });
  await b.close();
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 200)); process.exit(1); });
