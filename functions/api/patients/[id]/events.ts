import { getPatientEvents } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const events = await getPatientEvents(context.env.DB, id);
    if (!events) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json(events);
  } catch (error) {
    console.error("Failed to load patient events", error);
    return Response.json({ message: "Could not fetch patient events" }, { status: 500 });
  }
}
