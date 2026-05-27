// Bake a static snapshot of the Briefing Studio into public/ so it can be
// served by Vercel with no backend. Run:  node build-studio.mjs
//
// Produces:
//   public/studio.html        — the studio page (data + AI summary + email frame)
//   public/sample-email.html  — the rendered email the iframe loads
//   public/sample-email.txt    — the plaintext version

import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runBriefing } from "./index.js";
import { renderStudioPage } from "./src/studio.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "public");

async function main() {
  // Always use demo data for the public sample — no real signups exposed.
  console.log("[build-studio] generating demo briefing…");
  const gen = await runBriefing({ mode: "demo", send: false });
  const generatedAt = new Date();

  const studioHtml = renderStudioPage(
    { ...gen, mode: "demo", generatedAt },
    {
      staticMode: true,
      emailSrc: "sample-email.html",
      rawEmailHref: "sample-email.html",
      textHref: "sample-email.txt",
      from: process.env.RESEND_FROM || "briefing@yourdomain.com",
      to: process.env.RESEND_TO || "you@yourdomain.com",
      backHref: "/",
    }
  );

  await writeFile(join(PUBLIC, "studio.html"), studioHtml, "utf-8");
  await writeFile(join(PUBLIC, "sample-email.html"), gen.html, "utf-8");
  await writeFile(join(PUBLIC, "sample-email.txt"), gen.text, "utf-8");

  console.log("[build-studio] wrote public/studio.html");
  console.log("[build-studio] wrote public/sample-email.html");
  console.log("[build-studio] wrote public/sample-email.txt");
  console.log(`[build-studio] done — ${gen.leads.length} sample signups baked in`);
}

main().catch((err) => {
  console.error("[build-studio] failed:", err);
  process.exit(1);
});
