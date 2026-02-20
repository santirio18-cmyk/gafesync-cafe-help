import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "store.json");
const KV_KEY = "gafesync:store";

export type Table = { id: string; number: number };
export type HelpRequest = {
  id: string;
  tableId: string;
  tableNumber: number;
  requestedAt: string;
  status: "pending" | "attended";
  attendedBy?: string;
  attendedByName?: string;
  attendedAt?: string;
};
export type Staff = { id: string; username: string; passwordHash: string; displayName: string };
export type Session = { staffId: string; token: string; lastHeartbeat: number };

type Store = {
  tables: Table[];
  helpRequests: HelpRequest[];
  staff: Staff[];
  sessions: Session[];
};

const defaultStore: Store = {
  tables: [],
  helpRequests: [],
  staff: [],
  sessions: [],
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// In-memory fallback when Redis and file are unavailable (e.g. Vercel without Redis)
let memoryStore: Store | null = null;

async function load(): Promise<Store> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const raw = await redis.get<string>(KV_KEY);
      if (raw) return { ...defaultStore, ...JSON.parse(raw) };
    } catch {
      // fall through
    }
  }
  try {
    if (typeof existsSync !== "undefined") {
      ensureDataDir();
      if (existsSync(DATA_FILE)) {
        const raw = readFileSync(DATA_FILE, "utf-8");
        return { ...defaultStore, ...JSON.parse(raw) };
      }
    }
  } catch {
    // file not available (e.g. Vercel serverless)
  }
  if (!memoryStore) memoryStore = { ...defaultStore };
  return memoryStore;
}

async function save(store: Store): Promise<void> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url: redisUrl, token: redisToken });
      await redis.set(KV_KEY, JSON.stringify(store));
      return;
    } catch {
      // fall through
    }
  }
  try {
    if (typeof existsSync !== "undefined") {
      ensureDataDir();
      writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
      return;
    }
  } catch {
    // file not writable (e.g. Vercel)
  }
  memoryStore = store;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

// Tables
export async function getTables(): Promise<Table[]> {
  return (await load()).tables;
}

export async function addTable(number: number): Promise<Table> {
  const store = await load();
  if (store.tables.some((t) => t.number === number)) {
    throw new Error("Table number already exists");
  }
  const table: Table = { id: generateId(), number };
  store.tables.push(table);
  await save(store);
  return table;
}

export async function getTableByNumber(num: number): Promise<Table | undefined> {
  return (await load()).tables.find((t) => t.number === num);
}

// Help requests
export async function createHelpRequest(tableNumber: number): Promise<HelpRequest> {
  const store = await load();
  const table = store.tables.find((t) => t.number === tableNumber);
  if (!table) throw new Error("Table not found");
  const req: HelpRequest = {
    id: generateId(),
    tableId: table.id,
    tableNumber: table.number,
    requestedAt: new Date().toISOString(),
    status: "pending",
  };
  store.helpRequests.push(req);
  await save(store);
  return req;
}

export async function getHelpRequests(onlyPending = false): Promise<HelpRequest[]> {
  const reqs = (await load()).helpRequests;
  return onlyPending ? reqs.filter((r) => r.status === "pending") : reqs;
}

export async function attendHelpRequest(
  requestId: string,
  staffId: string,
  staffName: string
): Promise<HelpRequest | null> {
  const store = await load();
  const req = store.helpRequests.find((r) => r.id === requestId);
  if (!req || req.status !== "pending") return null;
  req.status = "attended";
  req.attendedBy = staffId;
  req.attendedByName = staffName;
  req.attendedAt = new Date().toISOString();
  await save(store);
  return req;
}

// Staff
export async function getStaffByUsername(username: string): Promise<Staff | undefined> {
  return (await load()).staff.find((s) => s.username.toLowerCase() === username.toLowerCase());
}

export async function getStaffById(id: string): Promise<Staff | undefined> {
  return (await load()).staff.find((s) => s.id === id);
}

export async function createStaff(
  username: string,
  passwordHash: string,
  displayName: string
): Promise<Staff> {
  const store = await load();
  if (store.staff.some((s) => s.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  const staff: Staff = { id: generateId(), username, passwordHash, displayName };
  store.staff.push(staff);
  await save(store);
  return staff;
}

// Sessions (active staff)
const HEARTBEAT_MAX_AGE_MS = 5 * 60 * 1000; // 5 min

export async function createSession(staffId: string): Promise<string> {
  const store = await load();
  const token = generateId();
  store.sessions = store.sessions.filter((s) => s.staffId !== staffId);
  store.sessions.push({ staffId, token, lastHeartbeat: Date.now() });
  await save(store);
  return token;
}

export async function getSessionStaffId(token: string): Promise<string | null> {
  const store = await load();
  const s = store.sessions.find((x) => x.token === token);
  if (!s || Date.now() - s.lastHeartbeat > HEARTBEAT_MAX_AGE_MS) return null;
  return s.staffId;
}

export async function heartbeat(token: string): Promise<boolean> {
  const store = await load();
  const s = store.sessions.find((x) => x.token === token);
  if (!s) return false;
  s.lastHeartbeat = Date.now();
  await save(store);
  return true;
}

export async function getActiveStaff(): Promise<Staff[]> {
  const store = await load();
  const now = Date.now();
  const activeIds = new Set(
    store.sessions.filter((s) => now - s.lastHeartbeat <= HEARTBEAT_MAX_AGE_MS).map((s) => s.staffId)
  );
  return store.staff.filter((s) => activeIds.has(s.id));
}

export async function logout(token: string): Promise<void> {
  const store = await load();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  await save(store);
}
