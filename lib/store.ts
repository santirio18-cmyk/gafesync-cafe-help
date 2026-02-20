import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "store.json");

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

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): Store {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return { ...defaultStore };
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return { ...defaultStore };
  }
}

function save(store: Store) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Tables
export function getTables(): Table[] {
  return load().tables;
}

export function addTable(number: number): Table {
  const store = load();
  if (store.tables.some((t) => t.number === number)) {
    throw new Error("Table number already exists");
  }
  const table: Table = { id: generateId(), number };
  store.tables.push(table);
  save(store);
  return table;
}

export function getTableByNumber(num: number): Table | undefined {
  return load().tables.find((t) => t.number === num);
}

// Help requests
export function createHelpRequest(tableNumber: number): HelpRequest {
  const store = load();
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
  save(store);
  return req;
}

export function getHelpRequests(onlyPending = false): HelpRequest[] {
  const reqs = load().helpRequests;
  return onlyPending ? reqs.filter((r) => r.status === "pending") : reqs;
}

export function attendHelpRequest(requestId: string, staffId: string, staffName: string): HelpRequest | null {
  const store = load();
  const req = store.helpRequests.find((r) => r.id === requestId);
  if (!req || req.status !== "pending") return null;
  req.status = "attended";
  req.attendedBy = staffId;
  req.attendedByName = staffName;
  req.attendedAt = new Date().toISOString();
  save(store);
  return req;
}

// Staff
export function getStaffByUsername(username: string): Staff | undefined {
  return load().staff.find((s) => s.username.toLowerCase() === username.toLowerCase());
}

export function getStaffById(id: string): Staff | undefined {
  return load().staff.find((s) => s.id === id);
}

export function createStaff(username: string, passwordHash: string, displayName: string): Staff {
  const store = load();
  if (store.staff.some((s) => s.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  const staff: Staff = { id: generateId(), username, passwordHash, displayName };
  store.staff.push(staff);
  save(store);
  return staff;
}

// Sessions (active staff)
const HEARTBEAT_MAX_AGE_MS = 5 * 60 * 1000; // 5 min

export function createSession(staffId: string): string {
  const store = load();
  const token = generateId();
  store.sessions = store.sessions.filter((s) => s.staffId !== staffId);
  store.sessions.push({ staffId, token, lastHeartbeat: Date.now() });
  save(store);
  return token;
}

export function getSessionStaffId(token: string): string | null {
  const store = load();
  const s = store.sessions.find((x) => x.token === token);
  if (!s || Date.now() - s.lastHeartbeat > HEARTBEAT_MAX_AGE_MS) return null;
  return s.staffId;
}

export function heartbeat(token: string): boolean {
  const store = load();
  const s = store.sessions.find((x) => x.token === token);
  if (!s) return false;
  s.lastHeartbeat = Date.now();
  save(store);
  return true;
}

export function getActiveStaff(): Staff[] {
  const store = load();
  const now = Date.now();
  const activeIds = new Set(
    store.sessions.filter((s) => now - s.lastHeartbeat <= HEARTBEAT_MAX_AGE_MS).map((s) => s.staffId)
  );
  return store.staff.filter((s) => activeIds.has(s.id));
}

export function logout(token: string) {
  const store = load();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  save(store);
}
