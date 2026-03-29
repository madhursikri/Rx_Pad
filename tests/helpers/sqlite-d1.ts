import initSqlJs from "sql.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");

type SqlJsDatabase = any;
type StatementResult<T> = { results: T[] };

let sqlJsPromise: Promise<any> | null = null;

async function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => wasmPath
    });
  }

  return sqlJsPromise;
}

function normalizeSql(sql: string): string {
  return sql.trim().replace(/\s+/g, " ");
}

class TestStatement {
  private values: unknown[] = [];

  constructor(private readonly db: SqlJsDatabase, private readonly sql: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async run() {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(this.values);
      stmt.step();
      return { success: true };
    } finally {
      stmt.free();
    }
  }

  async all<T>() {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(this.values);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      return { results } as StatementResult<T>;
    } finally {
      stmt.free();
    }
  }

  async first<T>() {
    const { results } = await this.all<T>();
    return results[0] ?? null;
  }
}

export type TestD1Database = D1Database & {
  exec(sql: string): void;
  raw: SqlJsDatabase;
};

export async function createTestD1Database(): Promise<TestD1Database> {
  const SQL = await getSqlJs();
  const raw = new SQL.Database();
  raw.run("PRAGMA foreign_keys = ON");

  const db = {
    exec(sql: string) {
      raw.exec(sql);
    },
    prepare(sql: string) {
      return new TestStatement(raw, sql);
    },
    batch(statements: Array<{ run(): Promise<unknown> }>) {
      return Promise.all(statements.map((statement) => statement.run())).then(() => undefined);
    },
    raw
  } as unknown as TestD1Database;

  return db;
}

export async function seedSql(db: TestD1Database, sql: string) {
  db.exec(sql);
}

export async function countRows(db: TestD1Database, table: string) {
  return db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first<{ count: number }>();
}

export async function tableRows<T>(db: TestD1Database, query: string) {
  return db.prepare(query).all<T>();
}

export function normalize(sql: string) {
  return normalizeSql(sql);
}
