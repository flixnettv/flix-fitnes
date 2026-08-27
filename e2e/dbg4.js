const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "ar" })).newPage();
  p.setDefaultTimeout(20000);
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message.slice(0, 400)));
  p.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 300)); });

  await p.goto("https://fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]", { timeout: 20000 });
  await p.fill("input[type=email]", "trainer@fitpro.hftv.qzz.io");
  await p.fill("input[type=password]", "Trainer2026!");
  await p.click("button[type=submit]");

  // wait for EITHER nav or an error, up to 30s
  try {
    await p.waitForSelector("text=باني التمرين", { timeout: 30000 });
    console.log("NAV OK");
  } catch {
    console.log("NAV MISSING. body snippet:");
    console.log((await p.textContent("body")).slice(0, 300));
  }
  if (errs.length) console.log("ERRS:\n" + errs.join("\n"));
  else console.log("no page errors");

  const navCount = await p.locator("text=باني التمرين").count();
  if (navCount) {
    await p.locator("text=باني التمرين").first().click();
    await p.waitForSelector("select", { timeout: 15000 });
    console.log("builder ok; selecting client…");
    await p.locator("select").first().selectOption({ index: 1 });
    await p.waitForTimeout(3500);
    console.log("post-select errs:", errs.length ? errs.join("\n") : "none");
    const btns = (await p.locator("button").allTextContents()).map((t) => t.trim()).filter(Boolean);
    console.log("has-save:", btns.some((t) => t.includes("حفظ")), "| buttons:", btns.slice(0, 8).join(" | "));
    await p.screenshot({ path: "shots/dbg3.png", fullPage: true });
  }
  await b.close();
})().catch((e) => { console.error("FATAL:", e.message.slice(0, 200)); process.exit(1); });
