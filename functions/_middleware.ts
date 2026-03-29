import { ensureDatabaseReady } from "@/lib/cloudflare-db";

type Env = {
  DB: D1Database;
  RX_PAD_BOOTSTRAP_MODE?: string;
};

type Context = {
  env: Env;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
};

export async function onRequest(context: Context) {
  const bootstrapMode = context.env.RX_PAD_BOOTSTRAP_MODE === "preview" ? "preview" : "production";
  context.waitUntil(
    ensureDatabaseReady(context.env.DB, bootstrapMode).catch((error) => {
      console.error("Preview bootstrap failed", error);
    })
  );
  return context.next();
}
