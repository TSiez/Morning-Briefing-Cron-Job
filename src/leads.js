import { getSupabase, yesterdayBoundsInTZ } from "./supabase.js";

export const SAMPLE_LEADS = [
  { name: "Emily Johnson", email: "emily.johnson@acmecorp.com", company: "Acme Corp" },
  { name: "Michael Smith", email: "michael.smith@finflow.com", company: "FinFlow" },
  { name: "Olivia Brown", email: "olivia.brown@growthlab.com", company: "GrowthLab" },
  { name: "James Williams", email: "james.williams@stackr.com", company: "Stackr" },
  { name: "Sophia Davis", email: "sophia.davis@clarityhq.com", company: "Clarity HQ" },
  { name: "Liam Miller", email: "liam.miller@buildco.com", company: "BuildCo" }
];

function companyFromEmail(email = "") {
  const domain = String(email).split("@")[1] || "";
  const root = domain.split(".")[0];
  if (!root) return "";
  return root.charAt(0).toUpperCase() + root.slice(1);
}

function normalizeRow(row) {
  const email = row.email || row.user_email || row.email_address || "";
  const name = row.name || row.full_name || row.display_name || row.first_name || email.split("@")[0] || "Unknown";
  const company = row.company || row.company_name || row.organization || companyFromEmail(email);
  return {
    name,
    email,
    company,
    created_at: row.created_at || row.signup_date || row.inserted_at || null,
    raw: row
  };
}

export async function getLeads(mode = "demo") {
  if (mode === "demo") return SAMPLE_LEADS;

  if (mode === "real") {
    return await fetchYesterdaysSignups();
  }

  throw new Error(`Unknown BRIEFING_MODE: ${mode}`);
}

export async function fetchYesterdaysSignups() {
  const supabase = await getSupabase();
  const tz = process.env.SCHEDULE_TZ || "UTC";
  const table = process.env.SUPABASE_SIGNUPS_TABLE || "signups";
  const tsCol = process.env.SUPABASE_SIGNUPS_TIMESTAMP_COLUMN || "created_at";

  const { from, to } = yesterdayBoundsInTZ(tz);

  console.log(`[leads] querying "${table}" where ${tsCol} in [${from.toISOString()}, ${to.toISOString()}) tz=${tz}`);

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .gte(tsCol, from.toISOString())
    .lt(tsCol, to.toISOString())
    .order(tsCol, { ascending: true });

  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  const rows = (data || []).map(normalizeRow);
  console.log(`[leads] fetched ${rows.length} signup(s) from yesterday`);
  return rows;
}
