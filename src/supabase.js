import { createClient } from "@supabase/supabase-js";

let cached = null;

async function resolveWebSocket() {
  if (typeof globalThis.WebSocket !== "undefined") return undefined;
  const { default: ws } = await import("ws");
  return ws;
}

export async function getSupabase() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (or your hosting provider's env vars)."
    );
  }

  const transport = await resolveWebSocket();
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(transport ? { realtime: { transport } } : {})
  });
  return cached;
}

// Returns { from, to } as Date objects in UTC that bracket "yesterday" in the given IANA tz.
// `from` is inclusive (yesterday 00:00 local), `to` is exclusive (today 00:00 local).
export function yesterdayBoundsInTZ(tz = "UTC") {
  const todayLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date()); // e.g. "2026-05-25"

  const [y, m, d] = todayLocal.split("-").map(Number);

  function midnightLocalAsUTC(year, month0, day, tz) {
    const guess = new Date(Date.UTC(year, month0, day, 12, 0, 0));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).formatToParts(guess);
    const map = {};
    for (const p of parts) map[p.type] = p.value;
    const asUTC = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second)
    );
    const offsetMs = asUTC - guess.getTime();
    return new Date(Date.UTC(year, month0, day, 0, 0, 0) - offsetMs);
  }

  const todayMidnight = midnightLocalAsUTC(y, m - 1, d, tz);
  const yesterdayMidnight = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);
  return { from: yesterdayMidnight, to: todayMidnight };
}
