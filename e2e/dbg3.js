const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  p.setDefaultTimeout(15000);
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message.slice(0, 300)));
  p.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 300)); });

  await p.goto("https://fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("input[type=email]", { timeout: 15000 });
  await p.fill("input[type=email]", "trainer@fitpro.hftv.qzz.io");
  await p.fill("input[type=password]", "Trainer2026!");
  await p.click("button[type=submit]");
  await p.waitForSelector("text=باني التمرين", { timeout: 20000 });
  await p.locator("text=باني التمرين").first().click();
  await p.waitForSelector("select", { timeout: 15000 });
  console.log("builder ok, selecting client…");
  await p.locator("select").first().selectOption({ index: 1 });
  await p.waitForTimeout(3500);
  console.log("errs:", errs.length ? errs.join("\n") : "none");
  console.log("bodyLen:", (await p.textContent("body")).length);
  await b.close();
})().catch((e) => { console.error("ERR:", e.message.slice(0, 200)); console.log("errs:", errs.join("\n")); process.exit(1); });
