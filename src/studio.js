// Shared renderer for the "Briefing Studio" surface — vintage newspaper style.
// Used live by preview.js (iframe -> /email, Regenerate -> /?fresh=1) and
// statically by build-studio.mjs (iframe -> sample-email.html, no backend).

export function esc(s = "") {
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

function briefingToStudioHtml(briefing) {
  return String(briefing)
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (!lines.length) return "";
      const bulleted = lines.every((l) => /^\s*[-*]\s+/.test(l));
      const numbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
      const inline = (s) =>
        esc(s)
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/`([^`]+)`/g, "<code>$1</code>");
      if (bulleted) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      if (numbered) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
      return `<p>${lines.map(inline).join("<br/>")}</p>`;
    })
    .join("\n");
}

function leadRows(leads) {
  return leads
    .map(
      (l) => `
        <div class="lead">
          <div class="lead-avatar">${esc(initials(l.name))}</div>
          <div class="lead-body">
            <div class="lead-name">${esc(l.name)}</div>
            <div class="lead-company">${esc(l.company || "")}</div>
          </div>
          <a class="lead-email" href="mailto:${esc(l.email)}">${esc(l.email)}</a>
        </div>`
    )
    .join("");
}

/**
 * Render the full Briefing Studio HTML page (vintage newspaper style).
 * @param {{leads:Array, briefing:string, subject:string, mode:string, generatedAt:Date}} gen
 * @param {{ staticMode?:boolean, emailSrc?:string, rawEmailHref?:string, textHref?:string,
 *           from?:string, to?:string, backHref?:string }} opts
 */
export function renderStudioPage(gen, opts = {}) {
  const {
    staticMode = false,
    emailSrc = "/email",
    rawEmailHref = "/email",
    textHref = "/text",
    from = "briefing@yourdomain.com",
    to = "you@yourdomain.com",
    backHref = null,
  } = opts;

  const { subject, leads, briefing, mode } = gen;
  const stamp = (gen.generatedAt || new Date()).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  const action = staticMode
    ? (backHref ? `<a class="btn-news" href="${backHref}"><span class="arrow">&larr;</span> Back to Front Page</a>` : "")
    : `<button class="btn-news" type="button" onclick="location.href='/?fresh=1'">Regenerate <span class="arrow">&#8635;</span></button>`;

  const sampleNote = staticMode
    ? `<div class="note"><strong>Sample edition.</strong> Generated from demo data. The live studio — with fresh AI summaries and your real signups — runs locally via <span class="mono">npm run preview</span>.</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Briefing Studio${subject ? " — " + esc(subject) : ""}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
  <style>
    *,*::before,*::after { box-sizing:border-box; }
    :root {
      --paper:#efe8d8; --paper-2:#e7dfcb; --ink:#16130c; --ink-soft:#3c3527;
      --muted:#6d6250; --rule:#16130c; --rule-faint:rgba(22,19,12,0.22);
      --display:'Playfair Display','Times New Roman',serif;
      --body:'PT Serif',Georgia,'Times New Roman',serif;
      --black:'UnifrakturCook','Playfair Display',serif;
      --mono:'JetBrains Mono',ui-monospace,monospace;
    }
    html { background:#d9d2c0; }
    body { margin:0; padding:24px 16px 56px; color:var(--ink); font-family:var(--body);
      font-size:16px; line-height:1.5; -webkit-font-smoothing:antialiased;
      background:radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,0,0,0.04), transparent 70%), #d9d2c0; }
    a { color:var(--ink); }
    .mono { font-family:var(--mono); }

    .sheet { max-width:1180px; margin:0 auto; background:var(--paper); border:1px solid var(--rule);
      box-shadow:0 2px 0 rgba(22,19,12,0.4), 0 26px 60px -26px rgba(0,0,0,0.5);
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.09  0 0 0 0 0.07  0 0 0 0 0.05  0 0 0 0.04 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); }

    /* Masthead bar */
    .top { border-bottom:3px double var(--rule); }
    .top-inner { display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding:14px 26px;
      border-bottom:1px solid var(--rule); }
    .brand { font-family:var(--black); font-size:24px; line-height:1; color:var(--ink); }
    .crumb { font-family:var(--mono); font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink-soft);
      border-left:1px solid var(--rule); padding-left:16px; }
    .spacer { flex:1; }
    .tag-badge { font-family:var(--mono); font-size:9.5px; letter-spacing:0.18em; text-transform:uppercase;
      border:1px solid var(--rule); padding:5px 10px; color:var(--ink); }
    .toggle { display:inline-flex; border:1px solid var(--rule); }
    .toggle button { border:0; background:transparent; padding:7px 14px; cursor:pointer; font-family:var(--mono);
      font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-soft); }
    .toggle button + button { border-left:1px solid var(--rule); }
    .toggle button.active { background:var(--ink); color:var(--paper); }
    .btn-news { display:inline-flex; align-items:center; gap:8px; background:var(--ink); color:var(--paper);
      border:1px solid var(--rule); padding:9px 16px; cursor:pointer; text-decoration:none;
      font-family:var(--mono); font-size:10px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase;
      box-shadow:3px 3px 0 rgba(22,19,12,0.85); transition:transform 0.12s, box-shadow 0.12s; }
    .btn-news:hover { transform:translate(-1px,-1px); box-shadow:5px 5px 0 rgba(22,19,12,0.85); }
    .btn-news .arrow { font-size:13px; }

    /* Title band */
    .titleband { text-align:center; padding:26px 26px 14px; }
    .titleband h1 { font-family:var(--display); font-weight:900; text-transform:uppercase;
      font-size:clamp(32px,6vw,62px); line-height:0.9; letter-spacing:-0.02em; margin:0; }
    .titleband .sub { font-family:var(--display); font-style:italic; font-weight:400; color:var(--ink-soft);
      font-size:clamp(15px,2vw,20px); margin:10px 0 0; }
    .strip { background:var(--ink); color:var(--paper); text-align:center; padding:9px 16px;
      font-family:var(--display); font-weight:700; font-size:13px; letter-spacing:0.12em; text-transform:uppercase; }

    .note { margin:22px 26px 0; border:1px solid var(--rule); padding:12px 16px; font-size:13.5px; line-height:1.5;
      background:var(--paper-2); }
    .note .mono { font-size:0.92em; }

    /* Grid */
    .grid { display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr); gap:0;
      border-top:1px solid var(--rule); margin-top:22px; }
    .grid > .left { border-right:1px solid var(--rule); }
    .panel { border-bottom:1px solid var(--rule); }
    .panel:last-child { border-bottom:0; }
    .panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px;
      padding:14px 22px; border-bottom:1px solid var(--rule); background:var(--paper-2); }
    .panel-head h2 { font-family:var(--display); font-weight:900; text-transform:uppercase; font-size:16px;
      letter-spacing:0.04em; margin:0; }
    .panel-head .meta { font-family:var(--mono); font-size:10px; letter-spacing:0.1em; color:var(--muted); text-transform:uppercase; }
    .panel-body { padding:18px 22px; }

    /* Signup data */
    .lead { display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:center;
      padding:11px 0; border-bottom:1px solid var(--rule-faint); }
    .lead:last-child { border-bottom:0; }
    .lead-avatar { width:34px; height:34px; border-radius:50%; border:1.5px solid var(--rule);
      display:flex; align-items:center; justify-content:center; font-family:var(--display); font-weight:700;
      font-size:13px; color:var(--ink); }
    .lead-name { font-family:var(--display); font-weight:700; font-size:15px; color:var(--ink); }
    .lead-company { font-size:13px; color:var(--muted); font-style:italic; }
    .lead-email { font-family:var(--mono); font-size:11px; color:var(--ink-soft); text-decoration:none; border-bottom:1px solid var(--rule-faint); }
    .lead-email:hover { border-bottom-color:var(--ink); }

    /* AI summary */
    .summary { font-size:14.5px; line-height:1.66; color:var(--ink); }
    .summary p { margin:0 0 13px; text-align:justify; hyphens:auto; }
    .summary strong { font-weight:700; }
    .summary code { font-family:var(--mono); font-size:0.84em; background:var(--paper-2); padding:0 5px; border:1px solid var(--rule-faint); }
    .summary ul, .summary ol { margin:6px 0 14px; padding-left:20px; }
    .summary li { margin:6px 0; line-height:1.55; }

    /* Email preview */
    .frame-wrap { display:flex; justify-content:center; }
    .frame { background:var(--paper-2); border:1px solid var(--rule); padding:12px; width:100%;
      transition:max-width 0.28s ease, padding 0.28s ease; }
    .frame.desktop { max-width:720px; }
    .frame.mobile { max-width:390px; padding:9px; }
    .frame-bar { display:flex; align-items:center; gap:7px; padding:2px 4px 10px; }
    .frame-bar i { width:9px; height:9px; border-radius:50%; border:1px solid var(--rule); background:var(--paper); }
    .frame-bar .addr { flex:1; background:var(--paper); border:1px solid var(--rule); padding:5px 10px;
      font-family:var(--mono); font-size:10px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    iframe.email { width:100%; border:1px solid var(--rule); background:#fff; display:block; min-height:520px; transition:height 0.15s ease; }
    .meta-row { display:flex; flex-wrap:wrap; gap:5px 16px; font-family:var(--mono); font-size:11px; color:var(--muted); margin-top:14px; }
    .meta-row b { color:var(--ink); font-weight:500; }
    .links { margin-top:14px; display:flex; gap:0; flex-wrap:wrap; border:1px solid var(--rule); width:fit-content; }
    .links a { font-family:var(--mono); font-size:11px; letter-spacing:0.04em; padding:8px 14px; text-decoration:none; color:var(--ink); }
    .links a + a { border-left:1px solid var(--rule); }
    .links a:hover { background:var(--ink); color:var(--paper); }

    @media (max-width:900px) { .grid { grid-template-columns:1fr; } .grid > .left { border-right:0; border-bottom:1px solid var(--rule); } }

    @keyframes rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .sheet { animation:rise 0.7s cubic-bezier(0.16,1,0.3,1) backwards; }
    @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:0.001ms !important; } }
    ::selection { background:var(--ink); color:var(--paper); }
  </style>
</head>
<body>
  <div class="sheet">

    <div class="top">
      <div class="top-inner">
        <span class="brand">The Morning Briefing</span>
        <span class="crumb">Briefing Studio</span>
        <span class="spacer"></span>
        <span class="tag-badge">${mode === "demo" ? "Demo Data" : "Live Data"}</span>
        <span class="tag-badge">${leads.length} ${leads.length === 1 ? "Signup" : "Signups"}</span>
        <div class="toggle" role="tablist" aria-label="Viewport">
          <button id="btn-desktop" class="active" type="button">Desktop</button>
          <button id="btn-mobile" type="button">Mobile</button>
        </div>
        ${action}
      </div>
    </div>

    <div class="titleband">
      <h1>The Composing Room</h1>
      <p class="sub">From raw signups to a readable brief, set in type before the kettle boils.</p>
    </div>
    <div class="strip">Signup Ledger &middot; AI Dispatch &middot; Proof of the Morning Edition</div>

    ${sampleNote}

    <div class="grid">
      <div class="left">
        <section class="panel">
          <div class="panel-head">
            <h2>Signup Ledger</h2>
            <span class="meta">${leads.length} ${mode === "demo" ? "sample" : "from yesterday"}</span>
          </div>
          <div class="panel-body">${leadRows(leads)}</div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>The Dispatch &mdash; AI Summary</h2>
            <span class="meta">groq &middot; llama-3.3-70b</span>
          </div>
          <div class="panel-body">
            <div class="summary">${briefingToStudioHtml(briefing)}</div>
          </div>
        </section>
      </div>

      <div class="right">
        <section class="panel">
          <div class="panel-head">
            <h2>Proof &mdash; Email Preview</h2>
            <span class="meta">${esc(stamp)}</span>
          </div>
          <div class="panel-body">
            <div class="frame-wrap">
              <div id="frame" class="frame desktop">
                <div class="frame-bar"><i></i><i></i><i></i><div class="addr">${esc(subject)}</div></div>
                <iframe id="email" class="email" src="${emailSrc}" title="Rendered email"></iframe>
              </div>
            </div>
            <div class="meta-row">
              <span>From <b>${esc(from)}</b></span>
              <span>To <b>${esc(to)}</b></span>
            </div>
            <div class="links">
              <a href="${rawEmailHref}" target="_blank">Open raw email</a>
              ${textHref ? `<a href="${textHref}" target="_blank">Plain text</a>` : ""}
            </div>
          </div>
        </section>
      </div>
    </div>

  </div>

  <script>
    const frame = document.getElementById('frame');
    const btnD = document.getElementById('btn-desktop');
    const btnM = document.getElementById('btn-mobile');
    btnD.addEventListener('click', () => { frame.classList.add('desktop'); frame.classList.remove('mobile'); btnD.classList.add('active'); btnM.classList.remove('active'); setTimeout(fit, 290); });
    btnM.addEventListener('click', () => { frame.classList.add('mobile'); frame.classList.remove('desktop'); btnM.classList.add('active'); btnD.classList.remove('active'); setTimeout(fit, 290); });
    const iframe = document.getElementById('email');
    function fit() { try { const h = iframe.contentDocument.documentElement.scrollHeight; iframe.style.height = (h + 16) + 'px'; } catch (_) {} }
    iframe.addEventListener('load', () => { fit(); setTimeout(fit, 80); setTimeout(fit, 300); });
    window.addEventListener('resize', fit);
  </script>
</body>
</html>`;
}
