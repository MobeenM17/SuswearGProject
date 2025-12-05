// db.ts
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export async function openDb() {
  const db = await open({
    filename: "./db/SustainWear.db",
    driver: sqlite3.Database,
  });

  await db.run("PRAGMA busy_timeout = 5000");

  return db;
}
