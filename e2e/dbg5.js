const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" })).newPage();
  p.setDefaultTimeout(20000);
  p.on("response", async (r) => {
    if (r.url().includes("/workouts/plans")) {
      console.log("API:", r.request().method(), r.status(), r.url().split("/api")[1]);
      if (r.status() >= 400) console.log("  body:", (await r.text()).slice(0, 200));
    }
  });
  await p.goto("https://fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]");
  await p.fill("input[type=email]", "trainer@fitpro.hftv.qzz.io");
  await p.fill("input[type=password]", "Trainer2026!");
  await p.click("button[type=submit]");
  await p.waitForSelector("text=باني التمرين", { timeout: 25000 });
  await p.locator("text=باني التمرين").first().click();
  await p.waitForSelector("select", { timeout: 15000 });
  await p.locator("select").first().selectOption({ index: 1 });
  await p.waitForSelector("button:has-text('حفظ')", { timeout: 10000 });
  await p.locator("button:has-text('حفظ')").first().click();
  await p.waitForTimeout(4000);
  const body = await p.textContent("body");
  const i = body.search(/حُفّظت|أُنشئت|تعذّر/);
  console.log("TOAST:", i >= 0 ? body.slice(i, i + 60) : "none");
  await b.close();
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 200)); process.exit(1); });
