import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSchema } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_FILE_PATH
  ? path.resolve(process.env.DB_FILE_PATH)
  : process.env.VERCEL
    ? "/tmp/db.json"
    : path.resolve(__dirname, "../data/db.json");

const emptyDb: DatabaseSchema = {
  patients: [],
  records: [],
};

function ensureDatabaseFile() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), "utf-8");
  }
}

export function readDb(): DatabaseSchema {
  ensureDatabaseFile();
  const raw = fs.readFileSync(dbPath, "utf-8");

  try {
    const parsed = JSON.parse(raw) as DatabaseSchema;
    return {
      patients: parsed.patients ?? [],
      records: parsed.records ?? [],
    };
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), "utf-8");
    return emptyDb;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDatabaseFile();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}
