export class DatabaseService {
  private static instance: DatabaseService | null = null

  private constructor() {
    // stub
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  initialize(): void {
    // stub
  }

  close(): void {
    // stub
  }
}
