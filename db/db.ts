// db.ts
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

let _db: Database | null = null;

export async function openDb() {
  if (_db) return _db;

  _db = await open({
    filename: "./db/SustainWear.db",
    driver: sqlite3.Database,
  });

  // Wait 5 seconds if the DB is busy
  await _db.run("PRAGMA busy_timeout = 5000");

  return _db;
}
