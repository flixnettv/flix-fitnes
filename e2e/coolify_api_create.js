const { chromium } = require("playwright");

// Correct UUIDs from DB
const PROJECT_UUID = "3etkutbr6rohafs4rnwjdl14"; // FitPro Center (id 9)
const ENV_UUID = "rflpfd3ixji5sis7m7udofba"; // production env (id 9)
const COOLIFY = "https://vps.hftv.qzz.io";
const EMAIL = "flixnettv@gmail.com";
const PASSWORD = "#Flix1571980";
const TOKEN = "8|9dc039189fe0fd9560adbbd8201ca321f7244088";

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

(async () => {
  // Step 1: Use API to create service properly
  console.log("[1] Creating service via API...");
  const res = await fetch(`${COOLIFY}/api/v1/services`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "FitPro Stack",
      description: "FitPro Center - Backend + Frontend + DB",
      environment_uuid: ENV_UUID,
      project_uuid: PROJECT_UUID,
      docker_compose_raw: Buffer.from(COMPOSE).toString("base64"),
      server_uuid: "ar9x4wsrr5jzqmezz6zkfox6", // flix server (id 2)
    }),
  });
  const data = await res.json();
  console.log("[2] Create response:", JSON.stringify(data).slice(0, 300));
  
  if (data.uuid) {
    const svcUuid = data.uuid;
    console.log("[3] Service created with UUID:", svcUuid);
    
    // Add env vars via API
    console.log("[4] Adding env vars...");
    const envVars = {
      "POSTGRES_PASSWORD": "6e6e421b12e9a1a4de88e66fbf25b3dc",
      "SECRET_KEY": "ef06e6495a1a28d2cab448383f3d16b12d373945ae7bd4878c51ceb9f634c6e4",
      "ALLOWED_HOSTS": "fitpro.hftv.qzz.io,.fitpro.hftv.qzz.io,hftv.qzz.io,localhost",
      "FRONTEND_URL": "https://fitpro.hftv.qzz.io",
      "CORS_ALLOWED_ORIGINS": "https://fitpro.hftv.qzz.io,https://*.fitpro.hftv.qzz.io",
      "CSRF_TRUSTED_ORIGINS": "https://fitpro.hftv.qzz.io,https://*.fitpro.hftv.qzz.io",
      "SENTRY_ENVIRONMENT": "production",
      "FITPRO_DYNAMIC_DIR": "/dyn-fitpro",
    };
    
    for (const [key, value] of Object.entries(envVars)) {
      const envRes = await fetch(`${COOLIFY}/api/v1/services/${svcUuid}/envs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });
      const envData = await envRes.json();
      console.log(`   ${key}: ${envRes.status}`);
    }
    
    // Start the service
    console.log("[5] Starting service...");
    const startRes = await fetch(`${COOLIFY}/api/v1/services/${svcUuid}/start`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${TOKEN}` },
    });
    const startData = await startRes.json();
    console.log("[6] Start response:", JSON.stringify(startData));
    
    // Wait and check
    console.log("[7] Waiting 30s for containers...");
    await new Promise(r => setTimeout(r, 30000));
    
    // Open browser to check
    const b = await chromium.launch({ headless: true });
    const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
    await p.goto(`${COOLIFY}/project/${PROJECT_UUID}/environment/${ENV_UUID}`, { waitUntil: "networkidle" });
    await p.screenshot({ path: "/tmp/cw-final.png" });
    
    // Also check the live site
    await p.goto("https://fitpro.hftv.qzz.io/health/", { waitUntil: "domcontentloaded", timeout: 15000 });
    console.log("[8] Health page content:", (await p.textContent("body")).slice(0, 200));
    
    await p.goto("https://sara-pro.fitpro.hftv.qzz.io", { waitUntil: "domcontentloaded", timeout: 15000 });
    await p.screenshot({ path: "/tmp/cw-sara.png" });
    
    await b.close();
    console.log("\nDONE - check /tmp/cw-final.png and /tmp/cw-sara.png");
  } else {
    console.log("FAILED to create service:", JSON.stringify(data));
    process.exit(1);
  }
})().catch(e => { console.error("FATAL:", e.message.slice(0, 300)); process.exit(1); });
