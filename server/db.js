// Import required libraries
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Opens a connection to the SQLite database
export async function openDB() {
  return open({
    filename: './full_game_schema.sqlite',  // Path to the SQLite database file
    driver: sqlite3.Database                // SQLite driver to use
  });
}
