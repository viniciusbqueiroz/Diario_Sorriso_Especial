import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { DatabaseSchema } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseEnabled = Boolean(supabaseUrl && supabaseServiceRoleKey);

const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const supabaseTableName = "app_state";
const supabaseStateRowId = "main";

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

function normalizeDatabaseSchema(parsed: unknown): DatabaseSchema {
  const data = parsed as Partial<DatabaseSchema> | null;

  return {
    patients: Array.isArray(data?.patients) ? data.patients : [],
    records: Array.isArray(data?.records) ? data.records : [],
  };
}

function readDbFromFile(): DatabaseSchema {
  ensureDatabaseFile();
  const raw = fs.readFileSync(dbPath, "utf-8");

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeDatabaseSchema(parsed);
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), "utf-8");
    return emptyDb;
  }
}

function writeDbToFile(data: DatabaseSchema): void {
  ensureDatabaseFile();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

async function ensureSupabaseStateRow(): Promise<void> {
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from(supabaseTableName)
    .select("id")
    .eq("id", supabaseStateRowId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao acessar estado no Supabase: ${error.message}`);
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from(supabaseTableName)
      .insert({ id: supabaseStateRowId, data: emptyDb });

    if (insertError) {
      throw new Error(
        `Falha ao inicializar estado no Supabase: ${insertError.message}`,
      );
    }
  }
}

async function readDbFromSupabase(): Promise<DatabaseSchema> {
  if (!supabase) {
    return emptyDb;
  }

  await ensureSupabaseStateRow();

  const { data, error } = await supabase
    .from(supabaseTableName)
    .select("data")
    .eq("id", supabaseStateRowId)
    .single();

  if (error) {
    throw new Error(`Falha ao ler dados do Supabase: ${error.message}`);
  }

  return normalizeDatabaseSchema(data?.data);
}

async function writeDbToSupabase(data: DatabaseSchema): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from(supabaseTableName)
    .upsert({ id: supabaseStateRowId, data }, { onConflict: "id" });

  if (error) {
    throw new Error(`Falha ao salvar dados no Supabase: ${error.message}`);
  }
}

export async function readDb(): Promise<DatabaseSchema> {
  if (isSupabaseEnabled) {
    return readDbFromSupabase();
  }

  return readDbFromFile();
}

export async function writeDb(data: DatabaseSchema): Promise<void> {
  if (isSupabaseEnabled) {
    await writeDbToSupabase(data);
    return;
  }

  writeDbToFile(data);
}
