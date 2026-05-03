import { Pool } from "pg"
import { logError, logInfo, serializeError } from "./logger"

let pool: Pool | null = null

let schemaReadyPromise: Promise<void> | null = null

const getConnectionString = () => process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || ""

const isLocalConnection = (connectionString: string) => {
  return /localhost|127\.0\.0\.1/i.test(connectionString)
}

const shouldUseSsl = (connectionString: string) => {
  const forceDisableSsl = process.env.DATABASE_SSL === "false" || process.env.PGSSLMODE === "disable"

  if (forceDisableSsl) {
    return false
  }

  if (/[?&]sslmode=disable/i.test(connectionString)) {
    return false
  }

  const forceEnableSsl = process.env.DATABASE_SSL === "true" || process.env.PGSSLMODE === "require" || /[?&]sslmode=require/i.test(connectionString)

  if (forceEnableSsl) {
    return true
  }

  return !isLocalConnection(connectionString)
}

const columnExists = async (tableName: string, columnName: string) => {
  const database = getPool()
  const result = await database.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists
  `, [tableName, columnName])

  return Boolean(result.rows[0]?.exists)
}

const ensureAttendanceRecordColumns = async () => {
  const database = getPool()

  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS employee_name TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS employee_id TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS department TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS course_key TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS course_label TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS cutoff_time TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS attendance_date TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS check_in_time TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS status TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS notes TEXT`)
  await database.query(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS created_at TEXT`)

  if (await columnExists("attendance_records", "student_name")) {
    await database.query(`
      UPDATE attendance_records
      SET employee_name = COALESCE(NULLIF(employee_name, ''), student_name)
      WHERE student_name IS NOT NULL
        AND student_name <> ''
        AND (employee_name IS NULL OR employee_name = '')
    `)
  }

  if (await columnExists("attendance_records", "student_id")) {
    await database.query(`
      UPDATE attendance_records
      SET employee_id = COALESCE(employee_id, student_id, '')
      WHERE employee_id IS NULL
    `)
    await database.query(`
      UPDATE attendance_records
      SET employee_id = student_id
      WHERE student_id IS NOT NULL
        AND student_id <> ''
        AND (employee_id IS NULL OR employee_id = '')
    `)
  }

  if (await columnExists("attendance_records", "faculty")) {
    await database.query(`
      UPDATE attendance_records
      SET department = COALESCE(NULLIF(department, ''), faculty)
      WHERE faculty IS NOT NULL
        AND faculty <> ''
        AND (department IS NULL OR department = '')
    `)
  }

  await database.query(`UPDATE attendance_records SET employee_name = 'Mahasiswa Tanpa Nama' WHERE employee_name IS NULL OR employee_name = ''`)
  await database.query(`UPDATE attendance_records SET employee_id = '' WHERE employee_id IS NULL`)
  await database.query(`UPDATE attendance_records SET department = 'Operasional' WHERE department IS NULL OR department = ''`)
  await database.query(`UPDATE attendance_records SET course_key = 'general' WHERE course_key IS NULL OR course_key = ''`)
  await database.query(`UPDATE attendance_records SET course_label = 'Kuliah Umum' WHERE course_label IS NULL OR course_label = ''`)
  await database.query(`UPDATE attendance_records SET cutoff_time = '10:00' WHERE cutoff_time IS NULL OR cutoff_time = ''`)
  await database.query(`UPDATE attendance_records SET attendance_date = CURRENT_DATE::text WHERE attendance_date IS NULL OR attendance_date = ''`)
  await database.query(`UPDATE attendance_records SET check_in_time = '00:00' WHERE check_in_time IS NULL OR check_in_time = ''`)
  await database.query(`UPDATE attendance_records SET status = 'hadir' WHERE status IS NULL OR status = ''`)
  await database.query(`UPDATE attendance_records SET notes = '' WHERE notes IS NULL`)
  await database.query(`UPDATE attendance_records SET created_at = NOW()::text WHERE created_at IS NULL OR created_at = ''`)

  await database.query(`ALTER TABLE attendance_records ALTER COLUMN employee_name SET DEFAULT 'Mahasiswa Tanpa Nama'`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN employee_name SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN employee_id SET DEFAULT ''`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN employee_id SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN department SET DEFAULT 'Operasional'`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN department SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN course_key SET DEFAULT 'general'`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN course_key SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN course_label SET DEFAULT 'Kuliah Umum'`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN course_label SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN cutoff_time SET DEFAULT '10:00'`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN cutoff_time SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN attendance_date SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN check_in_time SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN status SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN notes SET DEFAULT ''`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN notes SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_records ALTER COLUMN created_at SET NOT NULL`)
}

const ensureAttendanceSessionColumns = async () => {
  const database = getPool()

  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS course_key TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS course_label TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS attendance_date TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS lecturer TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS class_group TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS session_token TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS started_at TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS closed_at TEXT`)
  await database.query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS status TEXT`)

  if (await columnExists("attendance_sessions", "token")) {
    await database.query(`
      UPDATE attendance_sessions
      SET session_token = COALESCE(NULLIF(session_token, ''), token)
      WHERE token IS NOT NULL
        AND token <> ''
        AND (session_token IS NULL OR session_token = '')
    `)
  }

  await database.query(`UPDATE attendance_sessions SET course_key = 'general' WHERE course_key IS NULL OR course_key = ''`)
  await database.query(`UPDATE attendance_sessions SET course_label = 'Kuliah Umum' WHERE course_label IS NULL OR course_label = ''`)
  await database.query(`UPDATE attendance_sessions SET attendance_date = CURRENT_DATE::text WHERE attendance_date IS NULL OR attendance_date = ''`)
  await database.query(`UPDATE attendance_sessions SET lecturer = '' WHERE lecturer IS NULL`)
  await database.query(`UPDATE attendance_sessions SET class_group = '' WHERE class_group IS NULL`)
  await database.query(`UPDATE attendance_sessions SET session_token = '' WHERE session_token IS NULL`)
  await database.query(`UPDATE attendance_sessions SET started_at = NOW()::text WHERE started_at IS NULL OR started_at = ''`)
  await database.query(`UPDATE attendance_sessions SET status = 'open' WHERE status IS NULL OR status = ''`)

  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN course_key SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN course_label SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN attendance_date SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN lecturer SET DEFAULT ''`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN lecturer SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN class_group SET DEFAULT ''`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN class_group SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN session_token SET DEFAULT ''`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN session_token SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN started_at SET NOT NULL`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN status SET DEFAULT 'open'`)
  await database.query(`ALTER TABLE attendance_sessions ALTER COLUMN status SET NOT NULL`)
}

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

  await ensureAttendanceRecordColumns()
  await ensureAttendanceSessionColumns()

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

  const connectionString = getConnectionString()

  if (!connectionString) {
    throw new Error("Environment variable DATABASE_URL atau POSTGRES_URL wajib diisi untuk menjalankan aplikasi.")
  }

  pool = new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000
  })

  pool.on("error", (error) => {
    logError("PostgreSQL pool error", {
      error: serializeError(error)
    })
  })

  logInfo("PostgreSQL pool initialized", {
    sslEnabled: shouldUseSsl(connectionString)
  })

  return pool
}

export const isDatabaseConfigured = () => Boolean(getConnectionString())

export const testDatabaseConnection = async () => {
  const result = await query<{ now: string }>("SELECT NOW()::text AS now")

  return {
    connected: true,
    databaseTime: result.rows[0]?.now || null
  }
}

export const ensureDatabase = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createSchema().catch((error) => {
      schemaReadyPromise = null

      logError("PostgreSQL schema initialization failed", {
        error: serializeError(error)
      })

      throw error
    })
  }

  await schemaReadyPromise
}

export const query = async <T extends Record<string, any> = Record<string, any>>(text: string, values: any[] = []) => {
  await ensureDatabase()
  return getPool().query<T>(text, values)
}
