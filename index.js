import "dotenv/config";
import { pathToFileURL } from "node:url";
import { getLeads } from "./src/leads.js";
import { generateBriefing } from "./src/briefing.js";
import { renderEmailHtml, renderEmailText } from "./src/template.js";
import { sendBriefingEmail } from "./src/email.js";

function resolveMode(argv) {
  if (argv.includes("--demo")) return "demo";
  if (argv.includes("--real")) return "real";
  return (process.env.BRIEFING_MODE || "demo").toLowerCase();
}

export async function runBriefing({ mode = "demo", send = true } = {}) {
  console.log(`[briefing] mode=${mode}`);

  const leads = await getLeads(mode);
  console.log(`[briefing] fetched ${leads.length} leads`);

  const briefing = await generateBriefing(leads);
  console.log("\n--- Briefing ---\n" + briefing + "\n----------------\n");

  const date = new Date();
  const subject = `Morning Signup Briefing — ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })}`;
  const html = renderEmailHtml({ briefing, leads, date });
  const text = renderEmailText({ briefing, leads, date });

  if (!send) return { leads, briefing, subject, html, text, results: [] };

  const results = await sendBriefingEmail({ subject, html, text });
  for (const r of results) {
    if (r.sent) console.log(`[briefing] sent via ${r.transport} (id=${r.id})`);
    else if (r.skipped) console.log(`[briefing] skipped ${r.transport}: ${r.reason}`);
    else if (r.error) console.warn(`[briefing] ${r.transport} failed: ${r.error}`);
  }
  return { leads, briefing, subject, html, text, results };
}

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const mode = resolveMode(process.argv.slice(2));
  runBriefing({ mode }).catch((err) => {
    console.error("[briefing] failed:", err);
    process.exit(1);
  });
}
