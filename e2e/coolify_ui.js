const { chromium } = require("playwright");

const COOLIFY = "https://vps.hftv.qzz.io";
const EMAIL = "flixnettv@gmail.com";
const PASSWORD = "#Flix1571980";

// The compose file content
const COMPOSE = `services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fitpro
      POSTGRES_USER: fitpro
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fitpro_network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - fitpro_network
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - DEBUG=false
      - DJANGO_SETTINGS_MODULE=config.settings
      - SECRET_KEY=\${SECRET_KEY}
      - ALLOWED_HOSTS=\${ALLOWED_HOSTS}
      - DATABASE_URL=postgresql://fitpro:\${POSTGRES_PASSWORD}@postgres:5432/fitpro
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
      - CELERY_RESULT_BACKEND=redis://redis:6379/2
      - FRONTEND_URL=\${FRONTEND_URL}
      - CORS_ALLOWED_ORIGINS=\${CORS_ALLOWED_ORIGINS}
      - CSRF_TRUSTED_ORIGINS=\${CSRF_TRUSTED_ORIGINS}
      - FITPRO_DYNAMIC_DIR=/dyn-fitpro
    depends_on:
      - postgres
      - redis
    volumes:
      - /data/coolify/proxy/dynamic:/dyn-fitpro
    networks:
      - fitpro_network
      - coolify
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
  redis_data:

networks:
  fitpro_network:
    driver: bridge
  coolify:
    external: true`;

const ENV_VARS = `POSTGRES_PASSWORD=6e6e421b12e9a1a4de88e66fbf25b3dc
SECRET_KEY=ef06e6495a1a28d2cab448383f3d16b12d373945ae7bd4878c51ceb9f634c6e4
ALLOWED_HOSTS=fitpro.hftv.qzz.io,.fitpro.hftv.qzz.io,hftv.qzz.io,localhost
FRONTEND_URL=https://fitpro.hftv.qzz.io
CORS_ALLOWED_ORIGINS=https://fitpro.hftv.qzz.io,https://*.fitpro.hftv.qzz.io
CSRF_TRUSTED_ORIGINS=https://fitpro.hftv.qzz.io,https://*.fitpro.hftv.qzz.io
SENTRY_ENVIRONMENT=production
FITPRO_DYNAMIC_DIR=/dyn-fitpro`;

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({
    viewport: { width: 1400, height: 900 },
    locale: "en",
    ignoreHTTPSErrors: true,
  });
  const p = await ctx.newPage();
  p.setDefaultTimeout(30000);

  // Step 1: Login
  console.log("[1] Opening Coolify login...");
  await p.goto(COOLIFY, { waitUntil: "networkidle", timeout: 30000 });
  await p.screenshot({ path: "/tmp/cw-01-login.png" });

  // Fill email
  const emailInput = p.locator('input[name="email"], input[type="email"], #email').first();
  await emailInput.waitFor({ timeout: 15000 });
  await emailInput.fill(EMAIL);
  
  // Fill password
  const passInput = p.locator('input[name="password"], input[type="password"], #password').first();
  await passInput.fill(PASSWORD);
  
  // Click login
  await p.locator('button[type="submit"], button:has-text("Login"), button:has-text("Log in")').first().click();
  await p.waitForTimeout(3000);
  await p.screenshot({ path: "/tmp/cw-02-dashboard.png" });
  console.log("[2] Logged in, current URL:", p.url());

  // Step 2: Navigate to FitPro Center project
  console.log("[3] Looking for FitPro Center project...");
  // Try direct URL first
  await p.goto(`${COOLIFY}/project/3etkutbr6rohafs4rnwjdl14`, { waitUntil: "networkidle", timeout: 30000 });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: "/tmp/cw-03-project.png" });
  console.log("[4] Project page URL:", p.url());

  // Step 3: Click "+ New Resource" or similar
  console.log("[5] Looking for New Resource button...");
  const newResBtn = p.locator('a:has-text("New Resource"), button:has-text("New Resource"), a:has-text("Add Resource")').first();
  if (await newResBtn.count() > 0) {
    await newResBtn.click();
    await p.waitForTimeout(2000);
    await p.screenshot({ path: "/tmp/cw-04-new-resource.png" });
    console.log("[6] New resource page:", p.url());

    // Look for Docker Compose Empty option
    console.log("[7] Looking for Docker Compose option...");
    const composeOption = p.locator('button:has-text("Docker Compose Empty"), a:has-text("Docker Compose Empty"), [data-uuid="docker-compose-empty"]').first();
    if (await composeOption.count() > 0) {
      await composeOption.click();
      await p.waitForTimeout(2000);
      await p.screenshot({ path: "/tmp/cw-05-compose-form.png" });
      console.log("[8] Compose form:", p.url());

      // Fill service name
      const nameInput = p.locator('input[name="name"], input#name').first();
      if (await nameInput.count()) {
        await nameInput.fill("FitPro Stack");
        console.log("   Filled name: FitPro Stack");
      }

      // Fill docker compose content
      const composeInput = p.locator('textarea[name="docker_compose_raw"], textarea#docker_compose_raw, textarea.w-full.font-mono').first();
      if (await composeInput.count()) {
        await composeInput.fill(COMPOSE);
        console.log("   Filled compose (" + COMPOSE.length + " chars)");
      }

      // Save
      await p.locator('button:has-text("Save"), button:has-text("Continue")').first().click();
      await p.waitForTimeout(3000);
      await p.screenshot({ path: "/tmp/cw-06-saved.png" });
      console.log("[9] Saved, URL:", p.url());
    } else {
      console.log("   Docker Compose Empty option not found, listing all buttons...");
      const btns = await p.locator("button").allTextContents();
      console.log("   Buttons:", JSON.stringify(btns.filter(t => t.trim())));
    }
  } else {
    console.log("   New Resource not found, listing links...");
    const links = await p.locator("a").allTextContents();
    console.log("   Links:", JSON.stringify(links.filter(t => t.trim()).slice(0, 15)));
  }

  await b.close();
  console.log("\nDONE - check screenshots in /tmp/cw-*.png");
})().catch(e => { console.error("FATAL:", e.message.slice(0, 300)); process.exit(1); });
