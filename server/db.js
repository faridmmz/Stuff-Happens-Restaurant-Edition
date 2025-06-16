import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDB() {
  return open({
    filename: './full_game_schema.sqlite',  //  update here
    driver: sqlite3.Database
  });
}

