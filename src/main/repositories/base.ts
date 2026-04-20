import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'

export class BaseRepository {
  protected db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  protected generateId(): string {
    return randomUUID()
  }
}
