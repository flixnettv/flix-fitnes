/**
 * FitPro API client - connects the dashboard to the real Django backend.
 * JWT auth + real-data sync into the design's mock structures.
 */
import { CLIENTS, EXERCISES, GYMS, TRAINERS, type Client, type Exercise, type Trainer } from "../data";

const BASE = `${window.location.origin}/api/v1`;
const LS_TOKENS = "fitpro_auth_tokens";
const LS_USER = "fitpro_auth_user";

export type BackendRole = "super_admin" | "gym_admin" | "trainer" | "client";
export type DesignRole = "super" | "gymAdmin" | "trainer" | "client";

export const ROLE_MAP: Record<BackendRole, DesignRole> = {
  super_admin: "super",
  gym_admin: "gymAdmin",
  trainer: "trainer",
  client: "client",
};

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: BackendRole;
  isSuperuser: boolean;
}

interface Tokens { access: string; refresh: string }

export function getTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(LS_TOKENS);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch { return null; }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

function saveSession(tokens: Tokens, user: AuthUser) {
  localStorage.setItem(LS_TOKENS, JSON.stringify(tokens));
  localStorage.setItem(LS_USER, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(LS_TOKENS);
  localStorage.removeItem(LS_USER);
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const t = getTokens();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    signal: AbortSignal.timeout(10000),
    headers: {
      "Content-Type": "application/json",
      ...(t?.access ? { Authorization: `Bearer ${t.access}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let msg = "بيانات الدخول غير صحيحة";
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.detail || msg;
    } catch { /* noop */ }
    throw new Error(msg);
  }
  const j = await res.json();
  const u = j.user;
  const user: AuthUser = {
    id: String(u.id),
    username: u.username,
    email: u.email,
    firstName: u.first_name || "",
    lastName: u.last_name || "",
    role: (u.role || "client") as BackendRole,
    isSuperuser: u.is_superuser === true,
  };
  saveSession({ access: j.access, refresh: j.refresh }, user);
  return user;
}

/** Re-fetch the current user profile with a valid token (refreshes role/perms). */
export async function fetchMe(): Promise<AuthUser> {
  const u = await api<{
    id: string | number; username: string; email: string;
    first_name?: string; last_name?: string; role?: string; is_superuser?: boolean;
  }>("/auth/me/");
  const user: AuthUser = {
    id: String(u.id),
    username: u.username,
    email: u.email,
    firstName: u.first_name || "",
    lastName: u.last_name || "",
    role: (u.role || "client") as BackendRole,
    isSuperuser: u.is_superuser === true,
  };
  const t = getTokens();
  if (t) saveSession(t, user);
  return user;
}

/* ---------- branding ---------- */

export interface GymBrandingApi {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo: string | null;
}

export async function fetchBranding(): Promise<GymBrandingApi> {
  return api<GymBrandingApi>("/gyms/branding/");
}

/* ---------- real-data sync ---------- */

interface ApiMember {
  id: string; name: string; gymId: string; trainerId: string;
  membership: Client["membership"]; membershipEnd: string; goals: string[];
  weight: number; startWeight: number; targetWeight: number;
  adherence: number; joinedWeeks: number;
}
interface ApiTrainer {
  id: string; name: string; gymId: string; employeeId: string; spec: string[];
  certs: string[]; clients: number; maxClients: number; sessionsMonth: number;
  rating: number; hireDate: string; rate: number; active: boolean;
}

/** Overwrite the design's mock arrays in-place with live backend data. */
export async function syncRealData(): Promise<void> {
  try {
    const [members, trainers] = await Promise.all([
      api<ApiMember[]>("/gyms/members/"),
      api<ApiTrainer[]>("/gyms/trainers/"),
    ]);

    CLIENTS.length = 0;
    for (const m of members) {
      CLIENTS.push({
        id: m.id,
        name: m.name,
        gymId: m.gymId || "g1",
        trainerId: m.trainerId,
        membership: m.membership,
        membershipEnd: (m.membershipEnd || "").slice(0, 10),
        goals: m.goals?.length ? m.goals : ["لياقة عامة"],
        weight: m.weight ?? 0,
        startWeight: m.startWeight ?? m.weight ?? 0,
        targetWeight: m.targetWeight ?? m.weight ?? 0,
        adherence: Math.min(100, Math.max(0, m.adherence ?? 0)),
        lastWorkout: "",
        streak: 0,
        joinedWeeks: m.joinedWeeks ?? 0,
      } satisfies Client);
    }

    TRAINERS.length = 0;
    for (const t of trainers) {
      TRAINERS.push({
        id: t.id,
        name: t.name,
        gymId: t.gymId || "g1",
        employeeId: t.employeeId || "",
        spec: t.spec?.length ? t.spec : ["عام"],
        certs: t.certs || [],
        clients: t.clients ?? 0,
        maxClients: t.maxClients ?? 30,
        sessionsMonth: t.sessionsMonth ?? 0,
        rating: t.rating ?? 4.8,
        hireDate: (t.hireDate || "").slice(0, 7),
        rate: t.rate ?? 0,
        active: t.active !== false,
      } satisfies Trainer);
    }
  } catch (e) {
    console.warn("[fitpro] real-data sync skipped:", e);
  }
}

/** Restore session on app load; refreshes user/role from the server. */
export async function restoreSession(): Promise<AuthUser | null> {
  const stored = getStoredUser();
  if (!stored || !getTokens()) return null;
  // Validate token by hitting a light endpoint, then refresh user (fresh role).
  try {
    await api("/gyms/branding/");
    const fresh = await fetchMe();
    await syncRealData();
    return fresh;
  } catch {
    clearSession();
    return null;
  }
}

/** Call right after successful login to pull live lists. */
export async function postLoginSync(): Promise<void> {
  await syncRealData();
}

/* ---------- exercises & gyms sync ---------- */

const MUSCLE_AR: Record<string, string> = {
  chest: "صدر", back: "ظهر", legs: "أرجل", shoulders: "كتف",
  arms: "ذراعين", core: "بطن", full_body: "كامل الجسم", cardio: "كامل الجسم",
};
const DIFF_AR: Record<string, string> = {
  beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم",
};

interface ApiExercise {
  id: string; name: string; name_ar?: string;
  muscle_group: string; equipment: string; difficulty: string;
}

/** Rewrite EXERCISES with real backend UUIDs so plan builder sends valid FKs. */
export async function syncExercises(): Promise<void> {
  try {
    const res = await api<{ results: ApiExercise[] }>("/workouts/exercises/?page_size=200");
    const list = res.results || (res as unknown as ApiExercise[]);
    if (!Array.isArray(list) || !list.length) return;
    EXERCISES.length = 0;
    for (const e of list) {
      EXERCISES.push({
        id: e.id,
        nameAr: e.name_ar || e.name,
        nameEn: e.name,
        muscle: MUSCLE_AR[e.muscle_group] || e.muscle_group,
        equipment: e.equipment || "",
        difficulty: (DIFF_AR[e.difficulty] || "مبتدئ") as Exercise["difficulty"],
        defaultSets: 3,
        defaultReps: "10",
      } satisfies Exercise);
    }
  } catch (e) { console.warn("[fitpro] exercises sync skipped:", e); }
}

/** Put the real gym into the GYMS switcher (slot 0). */
export async function syncGyms(): Promise<void> {
  try {
    const b = await fetchBranding();
    const g = GYMS[0];
    g.id = "g1";
    g.nameAr = b.name;
    g.nameEn = b.name;
    g.initial = (b.name || "F").trim().charAt(0);
    g.accent = b.primary_color || g.accent;
    g.active = true;
  } catch { /* noop */ }
}

/* ---------- create member ---------- */

export async function createMember(payload: {
  email: string; password?: string; name: string; phone?: string;
  membership_type?: string; goals?: string[]; trainer_id?: string;
}): Promise<{ id: string; name: string; password_set: boolean }> {
  return api("/gyms/members/create/", { method: "POST", body: JSON.stringify(payload) });
}

/* ---------- plans ---------- */

export interface PlanDayPayload {
  day_number: number; name: string;
  exercises: { exercise: string; sets: number; reps: string; rest_seconds: number }[];
}

export async function createPlan(payload: {
  name: string; level: string; goal: string; duration_weeks: number; days: PlanDayPayload[];
}): Promise<{ id: string; name: string }> {
  return api("/workouts/plans/", { method: "POST", body: JSON.stringify(payload) });
}

export async function assignPlan(planId: string, clientId: string): Promise<unknown> {
  return api(`/workouts/plans/${planId}/assign/`, {
    method: "POST", body: JSON.stringify({ client_id: clientId }),
  });
}

export async function createMealPlan(payload: {
  name: string; goal: string; daily_calories: number;
  protein_target_g: number; carbs_target_g: number; fat_target_g: number;
}): Promise<{ id: string }> {
  return api("/nutrition/meal-plans/", { method: "POST", body: JSON.stringify(payload) });
}

export async function assignMealPlan(planId: string, clientId: string): Promise<unknown> {
  return api(`/nutrition/meal-plans/${planId}/assign/`, {
    method: "POST", body: JSON.stringify({ client_id: clientId }),
  });
}

/* ---------- check-in ---------- */

export async function createCheckin(p: {
  weight_kg: number; energy_level?: number; sleep_quality?: number;
  stress_level?: number; adherence?: number; client_notes?: string;
}): Promise<unknown> {
  const monday = new Date();
  const dow = (monday.getDay() + 6) % 7; // Monday=0
  monday.setDate(monday.getDate() - dow);
  return api("/progress/checkins/", {
    method: "POST",
    body: JSON.stringify({
      week_start: monday.toISOString().slice(0, 10),
      weight_kg: p.weight_kg,
      energy_level: p.energy_level ?? null,
      sleep_quality: p.sleep_quality ?? null,
      stress_level: p.stress_level ?? null,
      adherence: p.adherence ?? null,
      client_notes: p.client_notes ?? "",
    }),
  });
}

/* ---------- devices & wearables ---------- */

export interface MyDevice {
  id: string; kind: string; name: string; brand: string;
  status: "pending" | "active" | "revoked";
  pairing_code?: string | null;
  last_sync?: string | null;
  latest: Partial<Record<"weight_kg" | "body_fat" | "bpm" | "steps", number>> & { at?: string };
}

export async function devicesStartPair(payload: { kind: string; name?: string; brand?: string }) {
  return api<{ id: string; code: string; qr_url: string; expires_in: number }>("/devices/pair/start/", {
    method: "POST", body: JSON.stringify(payload),
  });
}

export async function devicesMine(): Promise<MyDevice[]> {
  return api<MyDevice[]>("/devices/mine/");
}

export async function devicesUnpair(id: string) {
  return api(`/devices/${id}/`, { method: "DELETE" });
}

export async function deviceMetrics(metric: string, days = 30): Promise<{ t: string; v: number }[]> {
  return api(`/devices/metrics/?metric=${metric}&days=${days}`);
}

/* ---------- per-client plans (trainer core) ---------- */

interface PlanDayApi {
  day_number: number; name: string;
  exercises: { exercise: string; sets: number; reps: string; rest_seconds: number }[];
}

/** Load the assigned (non-template) workout plan of a specific client, with days+exercises. */
export async function fetchClientWorkoutPlan(clientId: string): Promise<{ id: string; days: PlanDayApi[] } | null> {
  try {
    const list = await api<{ results: { id: string }[] }>(`/workouts/plans/?client=${clientId}&is_template=false`);
    const first = list.results?.[0];
    if (!first) return null;
    return api<{ id: string; days: PlanDayApi[] }>(`/workouts/plans/${first.id}/`);
  } catch { return null; }
}

export async function updateWorkoutPlan(planId: string, payload: Record<string, unknown>) {
  return api(`/workouts/plans/${planId}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

interface MealPlanApi {
  id: string;
  meals: {
    name: string; order: number; calories: number;
    protein_g?: string | number; carbs_g?: string | number; fat_g?: string | number;
    foods: { food: string; quantity_g: number }[];
  }[];
}

export async function fetchClientMealPlan(clientId: string): Promise<MealPlanApi | null> {
  try {
    const list = await api<{ results: { id: string }[] }>(`/nutrition/meal-plans/?client=${clientId}&is_template=false`);
    const first = list.results?.[0];
    if (!first) return null;
    return api<MealPlanApi>(`/nutrition/meal-plans/${first.id}/`);
  } catch { return null; }
}

export async function updateMealPlan(planId: string, payload: Record<string, unknown>) {
  return api(`/nutrition/meal-plans/${planId}/`, { method: "PATCH", body: JSON.stringify(payload) });
}


/* ---------- platform admin: gyms CRUD + appearance ---------- */

export interface AdminGym {
  id: string; name: string; slug: string; kind?: string;
  primary_color: string; secondary_color: string; accent_color: string;
  background_color: string; surface_color: string;
  font_family: string; default_theme: string;
  splash_title: string; splash_tagline: string; splash_style: string;
  city?: string; country?: string; is_active: boolean;
  members_count?: number; trainers_count?: number;
}

export async function fetchGyms(): Promise<AdminGym[]> {
  const r = await api<{ results: AdminGym[] }>("/gyms/?page_size=100");
  return r.results ?? (r as unknown as AdminGym[]);
}

export async function createGym(payload: Record<string, unknown>) {
  return api("/gyms/", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateGym(gymId: string, payload: Record<string, unknown>) {
  return api(`/gyms/${gymId}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function createTrainerStandalone(payload: Record<string, unknown>) {
  return api("/gyms/create-trainer/", { method: "POST", body: JSON.stringify(payload) });
}

export interface MyAppearance {
  slug: string; subdomain: string;
  primary_color: string; accent_color: string; background_color: string;
  default_theme: string;
  logo: string | null; banner: string | null; background_image: string | null;
  splash_title: string; splash_tagline: string; splash_style: string;
  splash_image: string | null;
}

export async function fetchMyAppearance(): Promise<MyAppearance> {
  return api<MyAppearance>("/my-appearance/");
}

/** PATCH appearance. images: File to set, null to clear, undefined = untouched. */
export async function updateMyAppearance(payload: Record<string, unknown>): Promise<{ changed: string[] }> {
  const hasFiles = Object.values(payload).some((v) => v instanceof File);
  if (hasFiles) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      if (v === undefined) continue;
      fd.append(k, v as string | Blob);
    }
    const t = getTokens();
    const res = await fetch(`${BASE}/my-appearance/update/`, {
      method: "PATCH",
      headers: t?.access ? { Authorization: `Bearer ${t.access}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }
  return api("/my-appearance/update/", { method: "PATCH", body: JSON.stringify(payload) });
}

/* ---------- platform admin: user account management ---------- */

export interface AdminUser {
  id: string; username: string; email: string;
  first_name: string; last_name: string;
  role: "super_admin" | "gym_admin" | "trainer" | "client";
  is_active: boolean; date_joined: string;
  gym_name?: string | null;
}

export async function fetchUsers(params = ""): Promise<{ count: number; results: AdminUser[] }> {
  return api(`/auth/users/?page_size=200${params}`);
}

export async function updateUser(id: string, patch: Record<string, unknown>) {
  return api(`/auth/users/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function setUserPassword(id: string, password: string) {
  return api(`/auth/users/${id}/set-password/`, { method: "POST", body: JSON.stringify({ password }) });
}

export async function deleteUser(id: string) {
  return api(`/auth/users/${id}/`, { method: "DELETE" });
}

/* ---------- trainers management (admin) ---------- */

export interface TrainerAdmin {
  id: string; name: string; email: string; gym: string; gym_name: string;
  employee_id: string; specialization: string[]; max_clients: number;
  clients_count: number; is_active: boolean;
}

export async function fetchTrainerAdmins(): Promise<TrainerAdmin[]> {
  const r = await api<{ results?: TrainerAdmin[] }>("/gyms/trainers-admin/?page_size=200");
  return r.results ?? (r as unknown as TrainerAdmin[]);
}

export async function updateTrainerAdmin(id: string, patch: Record<string, unknown>) {
  return api(`/gyms/trainers-admin/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function resetTrainerPassword(id: string, password: string) {
  return api(`/gyms/trainers-admin/${id}/reset-password/`, { method: "POST", body: JSON.stringify({ password }) });
}

export async function deleteTrainerAdmin(id: string) {
  return api(`/gyms/trainers-admin/${id}/`, { method: "DELETE" });
}

export async function fetchGymStats() {
  return api<Record<string, number>>("/gyms/stats/");
}
