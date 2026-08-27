/* GET /api/state - current tournament state.
   The Supabase key stays here on the server; it is never sent to the browser. */
const ROW = "pga2026";

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return res.status(500).json({ error: "server_not_configured" });

  try {
    const r = await fetch(
      `${url}/rest/v1/tournament?id=eq.${ROW}&select=state,rev`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!r.ok) return res.status(502).json({ error: "upstream", status: r.status });
    const rows = await r.json();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(rows[0] || { state: null, rev: 0 });
  } catch (e) {
    return res.status(502).json({ error: "upstream" });
  }
}
