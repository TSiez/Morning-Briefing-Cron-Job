import "dotenv/config";
import express from "express";
import { runBriefing } from "./index.js";

const PORT = Number(process.env.PREVIEW_PORT || 3030);
const app = express();

function shellPage({ emailHtml, subject, leadCount, mode, generatedAt }) {
  const safeSubject = subject.replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Email preview — ${safeSubject}</title>
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --ink: #0f172a;
      --muted: #64748b;
      --line: #e2e8f0;
      --accent: #4f46e5;
      --shadow: 0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.08);
    }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased; }
    header.topbar {
      position: sticky; top: 0; z-index: 5;
      background: rgba(255,255,255,0.85); backdrop-filter: saturate(180%) blur(12px);
      border-bottom: 1px solid var(--line);
    }
    .topbar-inner {
      max-width: 1100px; margin: 0 auto; padding: 14px 24px;
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.01em; }
    .brand-dot { width: 10px; height: 10px; border-radius: 3px; background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .brand small { color: var(--muted); font-weight: 400; margin-left: 6px; }
    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
      background: #eef2ff; color: #4338ca; font-size: 12px; font-weight: 500; letter-spacing: 0.02em; }
    .pill.muted { background: #f1f5f9; color: var(--muted); }
    .spacer { flex: 1; }
    .toggle { display: inline-flex; background: #f1f5f9; padding: 3px; border-radius: 10px; gap: 2px; }
    .toggle button {
      border: 0; background: transparent; padding: 6px 12px; border-radius: 8px; cursor: pointer;
      font-size: 13px; color: var(--muted); font-weight: 500; transition: all 0.15s;
    }
    .toggle button.active { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(15,23,42,0.06); }
    .toggle button:hover:not(.active) { color: var(--ink); }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 24px 64px; }
    .meta-card {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
      padding: 18px 22px; margin-bottom: 24px; box-shadow: var(--shadow);
      display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: center;
    }
    .meta-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px;
    }
    .meta-line1 { font-weight: 600; color: var(--ink); font-size: 15px; }
    .meta-line2 { color: var(--muted); font-size: 13px; margin-top: 2px; }
    .meta-line2 b { color: var(--ink); font-weight: 500; }
    .meta-stamp { color: var(--muted); font-size: 12px; text-align: right; white-space: nowrap; }
    .meta-stamp .row { display: block; }
    .frame-wrap { display: flex; justify-content: center; }
    .frame {
      background: #e2e8f0; border-radius: 18px; padding: 14px;
      box-shadow: var(--shadow); transition: max-width 0.25s ease, padding 0.25s ease;
      width: 100%;
    }
    .frame.desktop { max-width: 820px; }
    .frame.mobile  { max-width: 420px; padding: 10px; }
    .frame-bar {
      display: flex; align-items: center; gap: 6px; padding: 4px 8px 10px;
    }
    .frame-bar i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; background: #cbd5e1; }
    .frame-bar i.r { background: #fca5a5; }
    .frame-bar i.y { background: #fcd34d; }
    .frame-bar i.g { background: #86efac; }
    .frame-bar .addr {
      flex: 1; background: #fff; border-radius: 8px; padding: 6px 12px;
      font-size: 12px; color: var(--muted); border: 1px solid var(--line);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    iframe.email {
      width: 100%; border: 0; background: #fff; border-radius: 12px; display: block;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
      transition: height 0.15s ease;
    }
    .footer-links { margin-top: 28px; text-align: center; font-size: 13px; color: var(--muted); }
    .footer-links a { color: var(--accent); text-decoration: none; margin: 0 8px; }
    .footer-links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <span class="brand-dot"></span>
        Morning Briefing
        <small>preview</small>
      </div>
      <span class="pill">${mode === "demo" ? "Demo mode" : "Real mode"}</span>
      <span class="pill muted">${leadCount} leads</span>
      <div class="spacer"></div>
      <div class="toggle" role="tablist" aria-label="Viewport">
        <button id="btn-desktop" class="active" type="button">Desktop</button>
        <button id="btn-mobile" type="button">Mobile</button>
      </div>
    </div>
  </header>

  <main>
    <section class="meta-card" aria-label="Message header">
      <div class="meta-avatar">MB</div>
      <div>
        <div class="meta-line1">${safeSubject}</div>
        <div class="meta-line2">From <b>${(process.env.RESEND_FROM || "briefing@yourdomain.com").replace(/</g,"&lt;")}</b> &middot; To <b>${(process.env.RESEND_TO || "you@yourdomain.com").replace(/</g,"&lt;")}</b></div>
      </div>
      <div class="meta-stamp">
        <span class="row">${generatedAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        <span class="row">${generatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
      </div>
    </section>

    <div class="frame-wrap">
      <div id="frame" class="frame desktop">
        <div class="frame-bar"><i class="r"></i><i class="y"></i><i class="g"></i><div class="addr">inbox &mdash; ${safeSubject}</div></div>
        <iframe id="email" class="email" src="/email" title="Email body"></iframe>
      </div>
    </div>

    <div class="footer-links">
      <a href="/email" target="_blank">Open raw email</a>
      <a href="/text" target="_blank">Plain-text version</a>
      <a href="/" >Regenerate</a>
    </div>
  </main>

  <script>
    const frame = document.getElementById('frame');
    const btnD = document.getElementById('btn-desktop');
    const btnM = document.getElementById('btn-mobile');
    btnD.addEventListener('click', () => { frame.classList.remove('mobile'); frame.classList.add('desktop'); btnD.classList.add('active'); btnM.classList.remove('active'); });
    btnM.addEventListener('click', () => { frame.classList.remove('desktop'); frame.classList.add('mobile'); btnM.classList.add('active'); btnD.classList.remove('active'); });

    const iframe = document.getElementById('email');
    function fit() {
      try {
        const h = iframe.contentDocument.documentElement.scrollHeight;
        iframe.style.height = (h + 16) + 'px';
      } catch (_) {}
    }
    iframe.addEventListener('load', () => { fit(); setTimeout(fit, 60); setTimeout(fit, 250); });
    window.addEventListener('resize', fit);
  </script>
</body>
</html>`;
}

app.get("/", async (_req, res) => {
  try {
    const mode = (process.env.BRIEFING_MODE || "demo").toLowerCase();
    const { html, subject, leads } = await runBriefing({ mode, send: false });
    res.set("Content-Type", "text/html; charset=utf-8").send(
      shellPage({ emailHtml: html, subject, leadCount: leads.length, mode, generatedAt: new Date() })
    );
  } catch (err) {
    console.error("[preview] error:", err);
    res.status(500).type("text/html").send(`<pre style="padding:24px;font-family:ui-monospace,monospace;">${String((err && err.stack) || err)}</pre>`);
  }
});

app.get("/email", async (_req, res) => {
  try {
    const mode = (process.env.BRIEFING_MODE || "demo").toLowerCase();
    const { html } = await runBriefing({ mode, send: false });
    res.set("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (err) {
    res.status(500).type("text/plain").send(String((err && err.stack) || err));
  }
});

app.get("/text", async (_req, res) => {
  try {
    const mode = (process.env.BRIEFING_MODE || "demo").toLowerCase();
    const { text } = await runBriefing({ mode, send: false });
    res.set("Content-Type", "text/plain; charset=utf-8").send(text);
  } catch (err) {
    res.status(500).type("text/plain").send(String((err && err.stack) || err));
  }
});

app.listen(PORT, () => {
  console.log(`[preview] http://localhost:${PORT}`);
  console.log(`[preview]   /        framed preview (desktop / mobile toggle)`);
  console.log(`[preview]   /email   raw email HTML`);
  console.log(`[preview]   /text    plaintext version`);
});
