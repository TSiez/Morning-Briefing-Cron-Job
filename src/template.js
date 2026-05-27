const BRAND = {
  gold1: "#e6b979",        // bright gold (on dark only)
  gold2: "#c6a559",        // gold
  goldText: "#9a7415",     // readable gold for text on light backgrounds
  ink: "#1a1410",          // dark header / headings
  body: "#2a2218",         // body text on cream
  muted: "#8a7757",        // warm muted
  hairline: "#ece3d0",     // warm hairline
  surface: "#ffffff",      // card surface
  page: "#f5f0e6",         // warm cream page
  tint: "#faf5ea",         // gold-tinted callout box
  tintBorder: "#ecd9b0"    // gold-tinted box border
};

const FONT_STACK = "'Montserrat','Segoe UI',Helvetica,Arial,sans-serif";

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${BRAND.ink};font-weight:700;">$1</strong>`);
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+)`/g, `<code style="background:${BRAND.tint};padding:1px 6px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:${BRAND.goldText};">$1</code>`);
  return out;
}

function briefingToHtml(briefing) {
  const blocks = briefing.split(/\n{2,}/).map((rawBlock) => {
    const lines = rawBlock.split("\n").filter((l) => l.trim().length);
    if (!lines.length) return "";

    const isBulleted = lines.every((l) => /^\s*[-*]\s+/.test(l));
    const isNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));

    if (isBulleted) {
      return `<ul style="margin:8px 0 16px;padding-left:20px;color:${BRAND.body};">${lines
        .map((l) => `<li style="margin:6px 0;line-height:1.6;">${renderInline(l.replace(/^\s*[-*]\s+/, ""))}</li>`)
        .join("")}</ul>`;
    }
    if (isNumbered) {
      return `<ol style="margin:8px 0 16px;padding-left:22px;color:${BRAND.body};">${lines
        .map((l) => `<li style="margin:6px 0;line-height:1.6;">${renderInline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`)
        .join("")}</ol>`;
    }

    const headingMatch = lines[0].match(/^#{1,3}\s+(.+)/);
    if (headingMatch && lines.length === 1) {
      return `<h3 style="margin:20px 0 8px;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.ink};">${renderInline(headingMatch[1])}</h3>`;
    }

    return `<p style="margin:0 0 14px;line-height:1.65;color:${BRAND.body};font-size:15px;">${lines.map(renderInline).join("<br/>")}</p>`;
  });

  return blocks.join("\n");
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarColor(seed = "") {
  // Warm, on-brand palette — bronzes, ambers, golds, coppers.
  const palette = ["#b8860b", "#c87f3c", "#a8801f", "#9c6b2e", "#caa44a", "#b5722f", "#8f7029", "#cd853f"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function leadsTable(leads) {
  const rows = leads
    .map((l, i) => {
      const color = avatarColor(l.email);
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid ${BRAND.hairline};vertical-align:middle;width:44px;">
            <div style="width:36px;height:36px;border-radius:50%;background:${color};color:#fff;font-weight:600;font-size:13px;line-height:36px;text-align:center;letter-spacing:0.02em;">${escapeHtml(initials(l.name))}</div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid ${BRAND.hairline};vertical-align:middle;">
            <div style="font-weight:600;color:${BRAND.ink};font-size:14px;">${escapeHtml(l.name)}</div>
            <div style="color:${BRAND.muted};font-size:13px;margin-top:2px;">${escapeHtml(l.company)}</div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid ${BRAND.hairline};vertical-align:middle;text-align:right;">
            <a href="mailto:${escapeHtml(l.email)}" style="color:${BRAND.goldText};text-decoration:none;font-size:13px;font-weight:600;">${escapeHtml(l.email)}</a>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${BRAND.hairline};border-radius:12px;overflow:hidden;background:#fff;">
      <tbody>${rows}</tbody>
    </table>`;
}

export function renderEmailHtml({ briefing, leads, date = new Date() }) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const shortDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Morning Signup Briefing — ${shortDate}</title>
    <style>
      @media (max-width: 620px) {
        .mb-shell { width: 100% !important; border-radius: 0 !important; }
        .mb-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .mb-hide-sm { display: none !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.page};font-family:${FONT_STACK};color:${BRAND.body};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your prioritized signups and suggested opener for ${dateStr}.</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.page};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" class="mb-shell" style="max-width:640px;background:${BRAND.surface};border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(26,20,16,0.05),0 12px 32px rgba(26,20,16,0.10);">

            <tr>
              <td style="background:${BRAND.ink};background-image:linear-gradient(135deg,#1f1810 0%,#13100b 100%);padding:28px 36px;" class="mb-pad">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#e6b979,#c6a559);text-align:center;line-height:30px;color:#1a1410;font-size:17px;font-weight:800;">&#10003;</div>
                        </td>
                        <td style="vertical-align:middle;color:#f5ede0;font-size:14px;font-weight:600;letter-spacing:0.01em;">Tester<span style="color:#e6b979;">.io</span></td>
                      </tr></table>
                      <div style="display:inline-block;margin-top:16px;padding:4px 10px;border-radius:999px;border:1px solid rgba(230,185,121,0.4);color:#e6b979;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;">Morning Signup Briefing</div>
                      <h1 style="margin:12px 0 4px;font-size:26px;line-height:1.2;color:#f5ede0;font-weight:700;letter-spacing:-0.01em;">${dateStr}</h1>
                      <div style="color:#b9a986;font-size:14px;">${leads.length} new ${leads.length === 1 ? "signup" : "signups"} from yesterday</div>
                    </td>
                    <td class="mb-hide-sm" style="vertical-align:middle;text-align:right;width:64px;">
                      <div style="width:48px;height:48px;border-radius:12px;background:rgba(230,185,121,0.14);border:1px solid rgba(230,185,121,0.3);line-height:48px;text-align:center;font-size:22px;">&#x2600;&#xfe0f;</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 36px 8px;" class="mb-pad">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.goldText};font-weight:700;">Today's plan</div>
                <div style="margin-top:14px;background:${BRAND.tint};border:1px solid ${BRAND.tintBorder};border-radius:12px;padding:18px 20px;">
                  <div style="font-size:15px;line-height:1.65;color:${BRAND.body};">
                    ${briefingToHtml(briefing)}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 36px 8px;" class="mb-pad">
                <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;">
                  <h2 style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.goldText};font-weight:700;">Signup roster</h2>
                </div>
                ${leadsTable(leads)}
              </td>
            </tr>

            <tr>
              <td style="padding:24px 36px 32px;" class="mb-pad">
                <div style="border-top:1px solid ${BRAND.hairline};padding-top:16px;">
                  <div style="font-size:12px;color:${BRAND.muted};line-height:1.6;">
                    Generated automatically by your morning briefing job. Reply to this email to flag anything that should change tomorrow.
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <div style="max-width:640px;margin:16px auto 0;text-align:center;font-size:11px;color:${BRAND.muted};">
            Sent ${date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })} &middot; ${escapeHtml(process.env.RESEND_FROM || "briefing@yourdomain.com")}
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEmailText({ briefing, leads, date = new Date() }) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const leadLines = leads.map((l) => `  - ${l.name} (${l.company}) <${l.email}>`).join("\n");
  return `Morning Briefing — ${dateStr}\n\n${briefing}\n\nToday's leads (${leads.length}):\n${leadLines}\n`;
}
