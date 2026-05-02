import { Pool } from "pg"

let pool: Pool | null = null

let schemaReadyPromise: Promise<void> | null = null

const createSchema = async () => {
  const database = getPool()

  await database.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id SERIAL PRIMARY KEY,
      employee_name TEXT NOT NULL,
      employee_id TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT 'Operasional',
      course_key TEXT NOT NULL DEFAULT 'general',
      course_label TEXT NOT NULL DEFAULT 'Kuliah Umum',
      cutoff_time TEXT NOT NULL DEFAULT '10:00',
      attendance_date TEXT NOT NULL,
      check_in_time TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `)

  await database.query(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id SERIAL PRIMARY KEY,
      course_key TEXT NOT NULL,
      course_label TEXT NOT NULL,
      attendance_date TEXT NOT NULL,
      lecturer TEXT NOT NULL DEFAULT '',
      class_group TEXT NOT NULL DEFAULT '',
      session_token TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL,
      closed_at TEXT,
      status TEXT NOT NULL DEFAULT 'open'
    );
  `)

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_unique_student_id_idx
    ON attendance_records (lower(employee_id), attendance_date, course_key)
    WHERE employee_id <> '';
  `)

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_unique_student_name_idx
    ON attendance_records (lower(employee_name), attendance_date, course_key)
    WHERE employee_id = '';
  `)

  await database.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_sessions_open_token_idx
    ON attendance_sessions (session_token)
    WHERE status = 'open';
  `)
}

const getPool = () => {
  if (pool) {
    return pool
  }

  const connectionString = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim() || ""

  if (!connectionString) {
    throw new Error("Environment variable POSTGRES_URL atau DATABASE_URL wajib diisi untuk menjalankan aplikasi.")
  }

  pool = new Pool({
    connectionString
  })

  return pool
}

export const ensureDatabase = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createSchema()
  }

  await schemaReadyPromise
}

export const query = async <T extends Record<string, any> = Record<string, any>>(text: string, values: any[] = []) => {
  await ensureDatabase()
  return getPool().query<T>(text, values)
}
