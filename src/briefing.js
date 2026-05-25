import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You write a daily morning briefing about new signups for a SaaS founder.

Tone: direct, skimmable, like a smart chief-of-staff. No filler, no salutations, no emoji.

Required structure, in this exact order:

1. **Opening line** — one sentence stating the headline: total new signups + one notable cohort. Example: "You got 6 new signups yesterday, 2 are from SaaS companies — here's who to contact first."

2. **Breakdown** — a short bulleted list grouping signups by inferred company type / industry / company size signal. Use 2–4 bullets.

3. **Prioritized list** — numbered list of the top signups to reach out to (highest priority first). For each, include the name, company, and a one-line "why" referencing real signals from their data (email domain, company name, timing, plan/source if present).

4. **Suggested opener** — a 1–2 sentence outreach message for the single highest-priority signup, written in the founder's voice.

If there are zero signups, say so plainly in one short paragraph and stop.`;

function summarizeRow(row, i) {
  const fields = row.raw || row;
  const interesting = ["plan", "source", "utm_source", "utm_campaign", "role", "team_size", "country", "created_at"];
  const extras = interesting
    .map((k) => (fields[k] != null && fields[k] !== "" ? `${k}=${fields[k]}` : null))
    .filter(Boolean)
    .join(", ");
  const base = `${i + 1}. ${row.name || "Unknown"} — ${row.company || "(no company)"} <${row.email || "(no email)"}>`;
  return extras ? `${base}  [${extras}]` : base;
}

export async function generateBriefing(leads) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. Add it to .env.");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  if (!leads || leads.length === 0) {
    return "No new signups yesterday. Nothing to action — enjoy the quiet morning.";
  }

  const userPrompt = `Yesterday's signups (${leads.length}):\n\n${leads.map(summarizeRow).join("\n")}`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty completion.");
  return text;
}
