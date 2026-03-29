declare module "sql.js" {
  export type SqlJsStatic = {
    Database: new () => {
      run(sql: string): void;
      exec(sql: string): unknown;
      prepare(sql: string): {
        bind(values: unknown[] | Record<string, unknown>): void;
        step(): boolean;
        getAsObject(): Record<string, unknown>;
        free(): void;
      };
    };
  };

  export default function initSqlJs(options?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
