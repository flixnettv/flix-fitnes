const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" })).newPage();
  p.setDefaultTimeout(20000);
  p.on("console", (m) => { if (["warning", "error"].includes(m.type())) console.log("[console]", m.type(), m.text().slice(0, 200)); });
  p.on("response", (r) => { if (r.url().includes("/gyms/members")) console.log("members API:", r.status()); });

  await p.goto("https://fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]");
  await p.fill("input[type=email]", "trainer@fitpro.hftv.qzz.io");
  await p.fill("input[type=password]", "Trainer2026!");
  await p.click("button[type=submit]");
  await p.waitForSelector("text=باني التمرين", { timeout: 25000 });
  await p.waitForTimeout(1500); // allow post-login sync settle
  await p.locator("text=باني التمرين").first().click();
  await p.waitForSelector("select", { timeout: 15000 });
  const firstVal = await p.locator("select option").first().getAttribute("value");
  const allVals = await p.locator("select option").evaluateAll((os) => os.slice(0, 3).map((o) => o.value));
  console.log("option values:", JSON.stringify(allVals), "| first len:", (firstVal || "").length);
  await b.close();
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 200)); process.exit(1); });
