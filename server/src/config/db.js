import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database storage file path
const dbPath = path.join(__dirname, '..', '..', 'college_management.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Initialize SQLite database instance
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDB() {
  try {
    // Helper to safely add column if missing
    const addColumnIfMissing = (tableName, colName, colDef) => {
      try {
        const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
        const columnNames = tableInfo.map(c => c.name);
        if (tableInfo.length > 0 && !columnNames.includes(colName)) {
          db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colDef}`);
        }
      } catch (err) {
        // Table may not exist yet; schema.sql will create it
      }
    };

    // Users Migrations
    addColumnIfMissing('users', 'enrollment_number', 'TEXT');

    // Departments Migrations
    addColumnIfMissing('departments', 'status', "TEXT NOT NULL DEFAULT 'Active'");
    addColumnIfMissing('departments', 'updated_at', "DATETIME");

    // Classrooms Migrations
    addColumnIfMissing('classrooms', 'classroom_type', "TEXT NOT NULL DEFAULT 'Classroom'");
    addColumnIfMissing('classrooms', 'floor', "TEXT NOT NULL DEFAULT '1st Floor'");
    addColumnIfMissing('classrooms', 'status', "TEXT NOT NULL DEFAULT 'Active'");
    addColumnIfMissing('classrooms', 'created_at', "DATETIME");
    addColumnIfMissing('classrooms', 'updated_at', "DATETIME");

    // Timetables Migrations
    addColumnIfMissing('timetables', 'semester', "INTEGER DEFAULT 4");
    addColumnIfMissing('timetables', 'academic_year', "TEXT DEFAULT '2026-2027'");
    addColumnIfMissing('timetables', 'created_at', "DATETIME");
    addColumnIfMissing('timetables', 'updated_at', "DATETIME");

    // Clubs Migrations
    addColumnIfMissing('clubs', 'max_seats', "INTEGER DEFAULT 30");
    addColumnIfMissing('clubs', 'available_seats', "INTEGER DEFAULT 30");
    addColumnIfMissing('clubs', 'registration_start_date', "DATE");
    addColumnIfMissing('clubs', 'registration_end_date', "DATE");
    addColumnIfMissing('clubs', 'status', "TEXT DEFAULT 'Registration Open'");
    addColumnIfMissing('clubs', 'created_at', "DATETIME");
    addColumnIfMissing('clubs', 'updated_at', "DATETIME");

    // Club Events Migrations
    addColumnIfMissing('club_events', 'event_time', "TEXT");
    addColumnIfMissing('club_events', 'registration_start_date', "DATE");
    addColumnIfMissing('club_events', 'registration_last_date', "DATE");
    addColumnIfMissing('club_events', 'coordinator_id', "TEXT REFERENCES users(id)");
    addColumnIfMissing('club_events', 'status', "TEXT DEFAULT 'Upcoming'");
    addColumnIfMissing('club_events', 'banner_url', "TEXT");
    addColumnIfMissing('club_events', 'created_at', "DATETIME");
    addColumnIfMissing('club_events', 'updated_at', "DATETIME");

    // Doubts Migrations
    addColumnIfMissing('doubts', 'page_id', "TEXT");
    addColumnIfMissing('doubts', 'faculty_id', "TEXT REFERENCES users(id)");
    addColumnIfMissing('doubts', 'year', "TEXT");
    addColumnIfMissing('doubts', 'division', "TEXT");
    addColumnIfMissing('doubts', 'image_url', "TEXT");
    addColumnIfMissing('doubts', 'is_faculty_help_requested', "BOOLEAN DEFAULT 0");
    addColumnIfMissing('doubts', 'updated_at', "DATETIME");

    // Doubt Replies Migrations
    addColumnIfMissing('doubt_replies', 'image_url', "TEXT");
    addColumnIfMissing('doubt_replies', 'is_verified', "BOOLEAN DEFAULT 0");

    // Academic Performance Migrations
    addColumnIfMissing('academic_performance', 'faculty_id', "TEXT REFERENCES users(id)");
    addColumnIfMissing('academic_performance', 'department', "TEXT");
    addColumnIfMissing('academic_performance', 'year', "TEXT");
    addColumnIfMissing('academic_performance', 'division', "TEXT");
    addColumnIfMissing('academic_performance', 'attendance_percentage', "REAL DEFAULT 0");
    addColumnIfMissing('academic_performance', 'performance_status', "TEXT DEFAULT 'Good'");
    addColumnIfMissing('academic_performance', 'feedback', "TEXT");
    addColumnIfMissing('academic_performance', 'is_published', "BOOLEAN DEFAULT 1");
    addColumnIfMissing('academic_performance', 'updated_at', "DATETIME");

    // Classes Migrations
    addColumnIfMissing('classes', 'created_at', "DATETIME DEFAULT CURRENT_TIMESTAMP");

    // Notifications Migrations
    addColumnIfMissing('notifications', 'user_id', "TEXT REFERENCES users(id)");
    addColumnIfMissing('notifications', 'type', "TEXT DEFAULT 'GENERAL'");
    addColumnIfMissing('notifications', 'is_read', "BOOLEAN DEFAULT 0");
    addColumnIfMissing('notifications', 'link', "TEXT");

    // Attendance Records Migrations
    addColumnIfMissing('attendance_records', 'department', "TEXT");
    addColumnIfMissing('attendance_records', 'year', "TEXT");
    addColumnIfMissing('attendance_records', 'division', "TEXT");
    addColumnIfMissing('attendance_records', 'created_at', "DATETIME DEFAULT CURRENT_TIMESTAMP");
    addColumnIfMissing('attendance_records', 'updated_at', "DATETIME DEFAULT CURRENT_TIMESTAMP");

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_att_rec_unique ON attendance_records(student_id, subject_id, date);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_att_sum_unique ON attendance_summaries(student_id, subject_id, department, year, division);
    `);
    console.log('✅ [Database] SQLite Schema loaded successfully.');
  } catch (error) {
    console.error('❌ [Database] Failed to initialize schema:', error.message);
    throw error;
  }
}

/**
 * Helper: Query all matching rows
 * @param {string} query
 * @param {Array} params
 * @returns {Array}
 */
export function queryAll(query, params = []) {
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Helper: Query a single row
 * @param {string} query
 * @param {Array} params
 * @returns {Object|null}
 */
export function queryOne(query, params = []) {
  const stmt = db.prepare(query);
  return stmt.get(...params) || null;
}

/**
 * Helper: Execute an insert/update/delete
 * @param {string} query
 * @param {Array} params
 * @returns {Object}
 */
export function execute(query, params = []) {
  const stmt = db.prepare(query);
  return stmt.run(...params);
}

export default {
  db,
  initDB,
  queryAll,
  queryOne,
  execute
};
