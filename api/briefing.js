import { runBriefing } from "../index.js";

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.authorization || req.headers.Authorization || "";

  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const mode = (req.query?.mode || process.env.BRIEFING_MODE || "real").toLowerCase();

  try {
    const result = await runBriefing({ mode });
    return res.status(200).json({
      ok: true,
      mode,
      leads: result.leads.length,
      results: result.results
    });
  } catch (err) {
    console.error("[api/briefing] failed:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
