// Simple database helper for connecting to SQLite

import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

// Reuses the same connection to save performance
let _db: Database | null = null;

// Opens the database file and returns the connection
export async function openDb() {
  if (_db) return _db; // if already open, reuse it
  _db = await open({
    filename: "./db/SustainWear.db", // path to your SQLite file
    driver: sqlite3.Database,
  });
  return _db;
}
