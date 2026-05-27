// Vintage newspaper palette — monochrome ink on aged newsprint.
const BRAND = {
  gold1: "#16130c",        // (kept key names) — now ink
  gold2: "#16130c",
  goldText: "#16130c",     // links: black, underlined
  ink: "#16130c",          // headings / masthead
  body: "#2a2419",         // body text
  muted: "#6d6250",        // muted captions
  hairline: "#d6cbb3",     // hairline rules on paper
  surface: "#efe8d8",      // the "sheet" (newsprint cream)
  page: "#e2dac6",         // outer page
  tint: "#e7dfcb",         // callout box fill
  tintBorder: "#16130c"    // callout box border (black)
};

const FONT_STACK = "'PT Serif',Georgia,'Times New Roman',serif";
const DISPLAY_STACK = "'Playfair Display',Georgia,'Times New Roman',serif";

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

function leadsTable(leads) {
  const rows = leads
    .map((l, i) => {
      const last = i === leads.length - 1;
      const border = last ? "none" : `1px solid ${BRAND.hairline}`;
      return `
        <tr>
          <td style="padding:13px 14px;border-bottom:${border};vertical-align:middle;width:44px;">
            <div style="width:34px;height:34px;border-radius:50%;border:1.5px solid ${BRAND.ink};color:${BRAND.ink};font-family:${DISPLAY_STACK};font-weight:700;font-size:13px;line-height:31px;text-align:center;">${escapeHtml(initials(l.name))}</div>
          </td>
          <td style="padding:13px 14px;border-bottom:${border};vertical-align:middle;">
            <div style="font-family:${DISPLAY_STACK};font-weight:700;color:${BRAND.ink};font-size:15px;">${escapeHtml(l.name)}</div>
            <div style="color:${BRAND.muted};font-size:13px;font-style:italic;margin-top:1px;">${escapeHtml(l.company)}</div>
          </td>
          <td style="padding:13px 14px;border-bottom:${border};vertical-align:middle;text-align:right;">
            <a href="mailto:${escapeHtml(l.email)}" style="color:${BRAND.ink};text-decoration:none;font-size:12px;border-bottom:1px solid ${BRAND.hairline};">${escapeHtml(l.email)}</a>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${BRAND.ink};background:${BRAND.surface};">
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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
    <style>
      @media (max-width: 620px) {
        .mb-shell { width: 100% !important; }
        .mb-pad { padding-left: 22px !important; padding-right: 22px !important; }
        .mb-hide-sm { display: none !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.page};font-family:${FONT_STACK};color:${BRAND.body};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your prioritized signups and suggested opener for ${dateStr}.</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.page};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" class="mb-shell" style="max-width:640px;background:${BRAND.surface};border:1px solid ${BRAND.ink};box-shadow:0 2px 0 rgba(22,19,12,0.35),0 14px 36px rgba(22,19,12,0.12);">

            <!-- Nameplate -->
            <tr>
              <td style="padding:24px 36px 14px;border-bottom:3px double ${BRAND.ink};text-align:center;" class="mb-pad">
                <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};font-family:${FONT_STACK};">Tester.io &middot; Internal Dispatch</div>
                <h1 style="margin:10px 0 0;font-family:${DISPLAY_STACK};font-weight:900;font-size:38px;line-height:0.95;letter-spacing:-0.02em;color:${BRAND.ink};text-transform:uppercase;">Morning Briefing</h1>
                <div style="margin-top:10px;font-family:${DISPLAY_STACK};font-style:italic;font-size:15px;color:${BRAND.body};">${dateStr}</div>
              </td>
            </tr>

            <!-- Black strip -->
            <tr>
              <td style="background:${BRAND.ink};padding:9px 36px;text-align:center;" class="mb-pad">
                <div style="font-family:${DISPLAY_STACK};font-weight:700;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.surface};">${leads.length} new ${leads.length === 1 ? "signup" : "signups"} from yesterday</div>
              </td>
            </tr>

            <tr>
              <td style="padding:26px 36px 8px;" class="mb-pad">
                <div style="font-family:${FONT_STACK};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.ink};font-weight:700;border-bottom:1px solid ${BRAND.ink};padding-bottom:6px;">Today's Plan</div>
                <div style="margin-top:14px;background:${BRAND.tint};border:1px solid ${BRAND.tintBorder};padding:18px 20px;">
                  <div style="font-size:15px;line-height:1.65;color:${BRAND.body};">
                    ${briefingToHtml(briefing)}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 36px 8px;" class="mb-pad">
                <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;">
                  <h2 style="margin:0;width:100%;font-family:${FONT_STACK};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.ink};font-weight:700;border-bottom:1px solid ${BRAND.ink};padding-bottom:6px;">Signup Roster</h2>
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
