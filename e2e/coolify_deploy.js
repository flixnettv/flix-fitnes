const { chromium } = require("playwright");
const COOLIFY = "https://vps.hftv.qzz.io";
const EMAIL = "flixnettv@gmail.com";
const PASSWORD = "#Flix1571980";
const PROJECT_UUID = "3etkutbr6rohafs4rnwjdl14";

const COMPOSE = `services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fitpro
      POSTGRES_USER: fitpro
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb
    volumes:
      - redis_data:/data
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
      - FRONTEND_URL=\${FRONTEND_URL}
      - CORS_ALLOWED_ORIGINS=\${CORS_ALLOWED_ORIGINS}
      - CSRF_TRUSTED_ORIGINS=\${CSRF_TRUSTED_ORIGINS}
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
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, locale: "en", ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(30000);

  // Login
  console.log("[1] Login...");
  await p.goto(COOLIFY, { waitUntil: "networkidle" });
  await p.fill('input[name="email"], input[type="email"]', EMAIL);
  await p.fill('input[name="password"], input[type="password"]', PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(3000);
  console.log("[2] Logged in:", p.url());

  // Dismiss any notification banner
  const acceptBtn = p.locator("button:has-text('Accept and Close')");
  if (await acceptBtn.count()) { await acceptBtn.click(); await p.waitForTimeout(500); }

  // Navigate to project environment
  console.log("[3] Navigate to project environment...");
  await p.goto(`${COOLIFY}/project/${PROJECT_UUID}/production`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: "/tmp/cw-10-env.png" });
  console.log("[4] Environment page:", p.url());

  // Click "+ Add" or "New Resource" 
  console.log("[5] Looking for + Add button...");
  const addBtn = p.locator('a:has-text("+ Add"), button:has-text("+ Add"), a:has-text("New Resource"), button:has-text("New Resource")').first();
  if (await addBtn.count()) {
    await addBtn.click();
    await p.waitForTimeout(2000);
    await p.screenshot({ path: "/tmp/cw-11-add.png" });
    console.log("[6] Add page:", p.url());

    // Look for "Docker Compose Empty" option
    console.log("[7] Looking for Docker Compose Empty...");
    const composeOpt = p.locator('button:has-text("Docker Compose Empty"), a:has-text("Docker Compose Empty"), [data-uuid="docker-compose-empty"], .bg-gradient-to-br:has-text("Docker Compose Empty")').first();
    
    if (await composeOpt.count()) {
      console.log("   Found Docker Compose Empty, clicking...");
      await composeOpt.click();
      await p.waitForTimeout(3000);
      await p.screenshot({ path: "/tmp/cw-12-compose-form.png" });
      console.log("[8] Compose form:", p.url());

      // Fill service name
      const nameInput = p.locator('input[name="name"], input#name').first();
      if (await nameInput.count()) {
        await nameInput.fill("FitPro Stack");
        console.log("   Name filled");
      }

      // Fill compose content
      console.log("   Filling compose content...");
      const composeArea = p.locator('textarea[name="docker_compose_raw"], textarea#docker_compose_raw, textarea').first();
      if (await composeArea.count()) {
        await composeArea.fill(COMPOSE);
        console.log("   Compose filled (" + COMPOSE.length + " chars)");
      }

      // Save
      console.log("   Saving...");
      await p.locator('button:has-text("Save"), button:has-text("Continue")').first().click();
      await p.waitForTimeout(5000);
      await p.screenshot({ path: "/tmp/cw-13-saved.png" });
      console.log("[9] After save:", p.url());

      // Now add env vars - navigate to Environment Variables tab
      console.log("[10] Adding env vars...");
      const envTab = p.locator('a:has-text("Environment Variables"), a:has-text("Environment"), [wire\\:click*="envs"]').first();
      if (await envTab.count()) {
        await envTab.click();
        await p.waitForTimeout(1500);
        
        // Look for "Import from file" or bulk add
        const bulkBtn = p.locator('button:has-text("Import from file"), button:has-text("Bulk Add"), textarea[name="bulk_vars"]').first();
        if (await bulkBtn.count()) {
          const bulkArea = p.locator("textarea").last();
          await bulkArea.fill(ENV_VARS);
          await p.locator("button:has-text('Save')").first().click();
          await p.waitForTimeout(2000);
          console.log("   Env vars added");
        } else {
          // Add one by one
          const envLines = ENV_VARS.split("\\n");
          for (const line of envLines) {
            const [k, ...v] = line.split("=");
            const keyInput = p.locator('input[placeholder*="key"], input[name="key"]').first();
            const valInput = p.locator('input[placeholder*="value"], input[name="value"], textarea[name="value"]').first();
            if (await keyInput.count() && await valInput.count()) {
              await keyInput.fill(k);
              await valInput.fill(v.join("="));
              await p.locator('button:has-text("Add"), button:has-text("Save")').first().click();
              await p.waitForTimeout(500);
            }
          }
          console.log("   Env vars added one-by-one");
        }
      }

      // Deploy
      console.log("[11] Deploying...");
      const deployBtn = p.locator('button:has-text("Deploy"), button:has-text("Start")').first();
      if (await deployBtn.count()) {
        await deployBtn.click();
        await p.waitForTimeout(3000);
        await p.screenshot({ path: "/tmp/cw-14-deployed.png" });
        console.log("[12] DEPLOY TRIGGERED! URL:", p.url());
      }
    } else {
      // List all available options
      const opts = await p.locator("button, a").allTextContents();
      console.log("   Available options:", JSON.stringify(opts.filter(t => t.trim()).slice(0, 30)));
      await p.screenshot({ path: "/tmp/cw-11-all-options.png", fullPage: true });
    }
  } else {
    console.log("   Add button not found");
    // Try clicking on "production" text first
    const prodLink = p.locator("text=production").first();
    if (await prodLink.count()) {
      await prodLink.click();
      await p.waitForTimeout(2000);
      console.log("   Clicked production, URL:", p.url());
      await p.screenshot({ path: "/tmp/cw-11-production.png" });
    }
  }

  await b.close();
  console.log("\\nDONE");
})().catch(e => { console.error("FATAL:", e.message.slice(0, 300)); process.exit(1); });
