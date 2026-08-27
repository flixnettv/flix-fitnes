const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" })).newPage();
  p.setDefaultTimeout(20000);
  p.on("response", async (r) => {
    if (r.url().includes("/progress/checkins") && r.request().method() === "POST") {
      console.log("POST checkins:", r.status());
      if (r.status() >= 400) console.log("  body:", (await r.text()).slice(0, 250));
    }
  });
  await p.goto("https://fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]");
  await p.fill("input[type=email]", "client3@fitpro.hftv.qzz.io");
  await p.fill("input[type=password]", "Client2026!");
  await p.click("button[type=submit]");
  await p.waitForTimeout(4000);
  const tab = p.locator("button, a").filter({ hasText: "التسجيل" }).first();
  await tab.click();
  await p.waitForTimeout(1500);
  const send = p.locator("button").filter({ hasText: "إرسال" }).first();
  console.log("send count:", await send.count());
  await send.click();
  await p.waitForTimeout(3500);
  const body = await p.textContent("body");
  const i = body.search(/وصل|تعذّر|خطأ/);
  console.log("TOAST:", i >= 0 ? body.slice(i, i + 70) : "none");
  await b.close();
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 200)); process.exit(1); });
