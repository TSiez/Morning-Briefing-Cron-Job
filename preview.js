import "dotenv/config";
import express from "express";
import { runBriefing } from "./index.js";

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

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(name = "") {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function avatarColor(seed = "") {
  const palette = ["#b8860b", "#c87f3c", "#a8801f", "#9c6b2e", "#caa44a", "#b5722f", "#8f7029", "#cd853f"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// Render the AI briefing text into readable HTML for the dark studio summary panel.
function briefingToStudioHtml(briefing) {
  return briefing
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (!lines.length) return "";
      const bulleted = lines.every((l) => /^\s*[-*]\s+/.test(l));
      const numbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
      const inline = (s) =>
        esc(s)
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');
      if (bulleted) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      if (numbered) {
        return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
      }
      return `<p>${lines.map(inline).join("<br/>")}</p>`;
    })
    .join("\n");
}

function leadCards(leads) {
  return leads
    .map((l) => {
      const color = avatarColor(l.email || l.name);
      return `
        <div class="lead">
          <div class="lead-avatar" style="background:${color};">${esc(initials(l.name))}</div>
          <div class="lead-body">
            <div class="lead-name">${esc(l.name)}</div>
            <div class="lead-company">${esc(l.company || "")}</div>
          </div>
          <a class="lead-email" href="mailto:${esc(l.email)}">${esc(l.email)}</a>
        </div>`;
    })
    .join("");
}

function studioPage(gen) {
  const subject = gen.subject;
  const leads = gen.leads;
  const briefing = gen.briefing;
  const mode = gen.mode;
  const from = process.env.RESEND_FROM || "briefing@yourdomain.com";
  const to = process.env.RESEND_TO || "you@yourdomain.com";
  const stamp = gen.generatedAt.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>Briefing Studio — ${esc(subject)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    :root {
      --gold-1:#e6b979; --gold-2:#c6a559; --gold-line:rgba(230,185,121,0.26);
      --ink:#0a0908; --ink-2:#131110; --ink-3:#1c1814; --ink-card:#15120e;
      --cream:#f5ede0; --cream-2:#e9dec7; --muted:#998561; --muted-deep:#6b5d44;
      --hairline:rgba(245,237,224,0.07); --hairline-2:rgba(245,237,224,0.14);
      --gold-gradient:linear-gradient(135deg,#e6b979 0%,#d4a766 50%,#c6a559 100%);
    }
    html,body { margin:0; padding:0; background:var(--ink); color:var(--cream-2);
      font-family:'Montserrat',system-ui,sans-serif; font-weight:500; letter-spacing:-0.005em;
      -webkit-font-smoothing:antialiased; min-height:100vh; }
    body {
      background:
        radial-gradient(ellipse 70% 50% at 50% -10%, rgba(230,185,121,0.10) 0%, transparent 70%),
        radial-gradient(ellipse 40% 30% at 100% 0%, rgba(230,185,121,0.05) 0%, transparent 60%),
        var(--ink);
    }
    .mono { font-family:'JetBrains Mono',ui-monospace,monospace; }
    a { color:var(--gold-1); text-decoration:none; }

    .topbar {
      position:sticky; top:0; z-index:30;
      background:rgba(10,9,8,0.72); backdrop-filter:blur(14px) saturate(140%);
      border-bottom:1px solid var(--hairline);
    }
    .topbar-inner {
      max-width:1280px; margin:0 auto; padding:0 28px; height:60px;
      display:flex; align-items:center; gap:18px; flex-wrap:wrap;
    }
    .brand { display:inline-flex; align-items:center; gap:10px; font-weight:600; color:var(--cream); }
    .brand .logo { width:26px; height:26px; border-radius:7px; background:var(--gold-gradient);
      display:inline-flex; align-items:center; justify-content:center; box-shadow:0 0 14px rgba(230,185,121,0.3);
      color:#0a0908; font-weight:800; font-size:15px; }
    .brand em { color:var(--gold-1); font-style:normal; font-weight:500; }
    .divider { width:1px; height:20px; background:var(--hairline-2); }
    .crumb { font-size:13px; font-weight:600; color:var(--cream); }
    .spacer { flex:1; }
    .pill { display:inline-flex; align-items:center; gap:7px; padding:5px 11px; border-radius:999px;
      font-size:10.5px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
      border:1px solid var(--gold-line); color:var(--gold-1); background:rgba(230,185,121,0.06); }
    .pill.muted { border-color:var(--hairline-2); color:var(--muted); background:rgba(245,237,224,0.04); }
    .toggle { display:inline-flex; background:var(--ink-2); border:1px solid var(--hairline-2);
      border-radius:999px; padding:3px; gap:2px; }
    .toggle button { border:0; background:transparent; padding:7px 16px; border-radius:999px; cursor:pointer;
      font-family:'Montserrat',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.12em;
      text-transform:uppercase; color:var(--muted); transition:all 0.2s; }
    .toggle button.active { background:var(--gold-gradient); color:var(--ink);
      box-shadow:0 6px 16px -8px rgba(198,165,89,0.55), inset 0 1px 0 rgba(255,255,255,0.34); }
    .toggle button:hover:not(.active) { color:var(--cream-2); }
    .btn-regen { display:inline-flex; align-items:center; gap:8px; padding:9px 18px; border:0; border-radius:999px;
      background:var(--gold-gradient); color:var(--ink); font-family:'Montserrat',sans-serif; cursor:pointer;
      font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase;
      box-shadow:0 10px 22px -12px rgba(198,165,89,0.55), inset 0 1px 0 rgba(255,255,255,0.34); transition:all 0.18s; }
    .btn-regen:hover { transform:translateY(-1px); }
    .btn-regen svg { width:13px; height:13px; }

    main { max-width:1280px; margin:0 auto; padding:32px 28px 80px; }

    .label-brand { font-size:10px; font-weight:700; letter-spacing:0.26em; text-transform:uppercase; color:var(--gold-1); }

    .hero { margin-bottom:28px; }
    .hero h1 { font-size:clamp(28px,4vw,40px); font-weight:800; letter-spacing:-0.03em; color:var(--cream); margin:10px 0 0; line-height:1.05; }
    .hero h1 em { font-style:italic; font-weight:500; background:var(--gold-gradient);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

    .grid { display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr); gap:24px; align-items:start; }

    .card { position:relative; background:var(--ink-2); border-radius:14px; isolation:isolate;
      box-shadow:0 1px 0 rgba(230,185,121,0.04), 0 22px 48px -24px rgba(0,0,0,0.6); }
    .card::before { content:""; position:absolute; inset:0; border-radius:14px; padding:1px;
      background:linear-gradient(135deg, rgba(230,185,121,0.4) 0%, rgba(230,185,121,0.04) 40%, rgba(230,185,121,0.04) 70%, rgba(230,185,121,0.26) 100%);
      -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; }
    .card + .card { margin-top:24px; }
    .card-head { padding:18px 22px; border-bottom:1px solid var(--hairline); display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .card-body { padding:22px; }

    /* Signup data */
    .lead { display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:center;
      padding:12px 0; border-bottom:1px solid var(--hairline); }
    .lead:last-child { border-bottom:0; }
    .lead-avatar { width:36px; height:36px; border-radius:50%; color:#fff; font-weight:700; font-size:13px;
      display:flex; align-items:center; justify-content:center; letter-spacing:0.02em; }
    .lead-name { font-size:14px; font-weight:600; color:var(--cream); }
    .lead-company { font-size:12.5px; color:var(--muted); margin-top:1px; }
    .lead-email { font-size:12px; color:var(--gold-1); }
    .lead-email:hover { color:var(--cream); }

    /* AI summary */
    .summary { font-size:14.5px; line-height:1.7; color:var(--cream-2); }
    .summary p { margin:0 0 14px; }
    .summary strong { color:var(--cream); font-weight:700; }
    .summary code { font-family:'JetBrains Mono',monospace; font-size:0.86em; color:var(--gold-1);
      background:rgba(230,185,121,0.08); border:1px solid var(--gold-line); padding:1px 6px; border-radius:4px; }
    .summary ul, .summary ol { margin:8px 0 16px; padding-left:20px; }
    .summary li { margin:7px 0; line-height:1.6; }
    .summary li::marker { color:var(--gold-1); }

    /* Email frame */
    .frame-wrap { display:flex; justify-content:center; }
    .frame { background:var(--ink-3); border-radius:16px; padding:14px;
      box-shadow:0 22px 48px -24px rgba(0,0,0,0.7), inset 0 0 0 1px var(--hairline);
      transition:max-width 0.28s ease, padding 0.28s ease; width:100%; }
    .frame.desktop { max-width:760px; }
    .frame.mobile { max-width:400px; padding:10px; }
    .frame-bar { display:flex; align-items:center; gap:7px; padding:4px 8px 12px; }
    .frame-bar i { width:10px; height:10px; border-radius:50%; background:rgba(245,237,224,0.16); }
    .frame-bar i.r { background:rgba(232,123,107,0.5); }
    .frame-bar i.y { background:rgba(230,185,121,0.5); }
    .frame-bar i.g { background:rgba(168,200,160,0.5); }
    .frame-bar .addr { flex:1; background:var(--ink-2); border:1px solid var(--hairline-2); border-radius:8px;
      padding:6px 12px; font-size:11px; color:var(--muted); font-family:'JetBrains Mono',monospace;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    iframe.email { width:100%; border:0; background:#fff; border-radius:12px; display:block; transition:height 0.15s ease; }

    .meta-row { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:12px; color:var(--muted); margin-top:14px; }
    .meta-row b { color:var(--cream-2); font-weight:600; }
    .links { margin-top:18px; display:flex; gap:8px; flex-wrap:wrap; }
    .links a { font-size:12px; padding:7px 13px; border-radius:999px; border:1px solid var(--hairline-2);
      color:var(--cream-2); background:rgba(245,237,224,0.04); transition:all 0.15s; }
    .links a:hover { border-color:var(--gold-line); color:var(--gold-1); }

    @media (max-width:980px) { .grid { grid-template-columns:1fr; } }

    @keyframes rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .hero, .grid > * { animation:rise 0.7s cubic-bezier(0.16,1,0.3,1) backwards; }
    .grid > *:nth-child(2) { animation-delay:0.1s; }

    ::selection { background:var(--gold-1); color:var(--ink); }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <span class="brand"><span class="logo">&#10003;</span> Tester<em>.io</em></span>
      <span class="divider"></span>
      <span class="crumb">Briefing Studio</span>
      <span class="spacer"></span>
      <span class="pill ${mode === "demo" ? "" : "muted"}">${mode === "demo" ? "Demo data" : "Live data"}</span>
      <span class="pill muted">${leads.length} ${leads.length === 1 ? "signup" : "signups"}</span>
      <div class="toggle" role="tablist" aria-label="Viewport">
        <button id="btn-desktop" class="active" type="button">Desktop</button>
        <button id="btn-mobile" type="button">Mobile</button>
      </div>
      <button class="btn-regen" type="button" onclick="location.href='/?fresh=1'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>
        Regenerate
      </button>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="label-brand">Morning Signup Briefing</div>
      <h1>From raw signups<br/>to a <em>readable brief.</em></h1>
    </section>

    <div class="grid">

      <!-- LEFT: data + AI summary -->
      <div>
        <section class="card">
          <div class="card-head">
            <span class="label-brand">Signup Data</span>
            <span class="mono" style="font-size:11px;color:var(--muted);">${leads.length} ${mode === "demo" ? "sample" : "from yesterday"}</span>
          </div>
          <div class="card-body" style="padding-top:6px;padding-bottom:8px;">
            ${leadCards(leads)}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <span class="label-brand">AI Summary</span>
            <span class="mono" style="font-size:11px;color:var(--muted);">groq · llama-3.3-70b</span>
          </div>
          <div class="card-body">
            <div class="summary">${briefingToStudioHtml(briefing)}</div>
          </div>
        </section>
      </div>

      <!-- RIGHT: rendered email -->
      <div>
        <section class="card">
          <div class="card-head">
            <span class="label-brand">Email Preview</span>
            <span class="mono" style="font-size:11px;color:var(--muted);">${esc(stamp)}</span>
          </div>
          <div class="card-body">
            <div class="frame-wrap">
              <div id="frame" class="frame desktop">
                <div class="frame-bar"><i class="r"></i><i class="y"></i><i class="g"></i><div class="addr">${esc(subject)}</div></div>
                <iframe id="email" class="email" src="/email" title="Rendered email"></iframe>
              </div>
            </div>
            <div class="meta-row">
              <span>From <b>${esc(from)}</b></span>
              <span>To <b>${esc(to)}</b></span>
            </div>
            <div class="links">
              <a href="/email" target="_blank">Open raw email &#8599;</a>
              <a href="/text" target="_blank">Plain-text version &#8599;</a>
            </div>
          </div>
        </section>
      </div>

    </div>
  </main>

  <script>
    const frame = document.getElementById('frame');
    const btnD = document.getElementById('btn-desktop');
    const btnM = document.getElementById('btn-mobile');
    btnD.addEventListener('click', () => { frame.classList.add('desktop'); frame.classList.remove('mobile'); btnD.classList.add('active'); btnM.classList.remove('active'); setTimeout(fit, 290); });
    btnM.addEventListener('click', () => { frame.classList.add('mobile'); frame.classList.remove('desktop'); btnM.classList.add('active'); btnD.classList.remove('active'); setTimeout(fit, 290); });

    const iframe = document.getElementById('email');
    function fit() {
      try {
        const h = iframe.contentDocument.documentElement.scrollHeight;
        iframe.style.height = (h + 16) + 'px';
      } catch (_) {}
    }
    iframe.addEventListener('load', () => { fit(); setTimeout(fit, 80); setTimeout(fit, 300); });
    window.addEventListener('resize', fit);
  </script>
</body>
</html>`;
}

app.get("/", async (req, res) => {
  try {
    const mode = (process.env.BRIEFING_MODE || "demo").toLowerCase();
    if (!lastGen || lastGen.mode !== mode || req.query.fresh) {
      await generate(mode);
    }
    res.set("Content-Type", "text/html; charset=utf-8").send(studioPage(lastGen));
  } catch (err) {
    console.error("[preview] error:", err);
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
