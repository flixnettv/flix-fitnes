const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  p.setDefaultTimeout(15000);
  await p.goto("https://fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await page_fill(p);
  async function page_fill(p) {
    await p.waitForSelector("input[type=email]", { timeout: 15000 });
    await p.fill("input[type=email]", "trainer@fitpro.hftv.qzz.io");
    await p.fill("input[type=password]", "Trainer2026!");
    await p.click("button[type=submit]");
  }
  await p.waitForSelector("text=باني التمرين", { timeout: 20000 });
  await p.locator("text=باني التمرين").first().click();
  await p.waitForSelector("select", { timeout: 15000 });
  console.log("on builder ✓");
  await p.locator("select").first().selectOption({ index: 1 });
  await p.waitForTimeout(3000);
  const btns = await p.locator("button").allTextContents();
  console.log("BUTTONS:", JSON.stringify(btns.map((t) => t.trim()).filter(Boolean)));
  const bodyErr = await p.locator("text=خطأ").count();
  console.log("error-boundary:", bodyErr);
  await p.screenshot({ path: "shots/dbg2.png", fullPage: true });
  await b.close();
})().catch((e) => { console.error("ERR:", e.message.slice(0, 300)); process.exit(1); });
