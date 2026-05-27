import "dotenv/config";
import express from "express";
import { runBriefing } from "./index.js";
import { renderStudioPage, esc } from "./src/studio.js";

const PORT = Number(process.env.PREVIEW_PORT || 3030);
const app = express();

// Cache the most recent generation so the summary panel and the email iframe
// always reflect the *same* run (one Groq call, not two divergent ones).
let lastGen = null;

async function generate(mode) {
  const result = await runBriefing({ mode, send: false });
  lastGen = { id: Date.now().toString(36), mode, generatedAt: new Date(), ...result };
  return lastGen;
}

app.get("/", async (req, res) => {
  try {
    const mode = (process.env.BRIEFING_MODE || "demo").toLowerCase();
    if (!lastGen || lastGen.mode !== mode || req.query.fresh) {
      await generate(mode);
    }
    const html = renderStudioPage(lastGen, {
      staticMode: false,
      emailSrc: "/email",
      rawEmailHref: "/email",
      textHref: "/text",
      from: process.env.RESEND_FROM || "briefing@yourdomain.com",
      to: process.env.RESEND_TO || "you@yourdomain.com",
    });
    res.set("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (err) {
    console.error("[studio] error:", err);
    res.status(500).type("text/html").send(
      `<body style="background:#0a0908;color:#e87b6b;font-family:monospace;padding:40px;"><pre>${esc(String((err && err.stack) || err))}</pre></body>`
    );
  }
});

app.get("/email", async (_req, res) => {
  try {
    if (!lastGen) await generate((process.env.BRIEFING_MODE || "demo").toLowerCase());
    res.set("Content-Type", "text/html; charset=utf-8").send(lastGen.html);
  } catch (err) {
    res.status(500).type("text/plain").send(String((err && err.stack) || err));
  }
});

app.get("/text", async (_req, res) => {
  try {
    if (!lastGen) await generate((process.env.BRIEFING_MODE || "demo").toLowerCase());
    res.set("Content-Type", "text/plain; charset=utf-8").send(lastGen.text);
  } catch (err) {
    res.status(500).type("text/plain").send(String((err && err.stack) || err));
  }
});

app.listen(PORT, () => {
  console.log(`[studio] http://localhost:${PORT}`);
  console.log(`[studio]   /            briefing studio (data + AI summary + email preview)`);
  console.log(`[studio]   /?fresh=1    force a new generation`);
  console.log(`[studio]   /email       raw email HTML   ·   /text   plaintext`);
});
