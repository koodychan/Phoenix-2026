/* POST /api/save {pw, state, baseRev}
   Writes go through the save_tournament function, which checks the password in
   the database. The browser never decides whether a write is allowed. */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return res.status(500).json({ error: "server_not_configured" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { pw, state, baseRev } = body;
  if (typeof pw !== "string" || state == null || typeof baseRev !== "number")
    return res.status(400).json({ error: "bad_request" });

  try {
    const r = await fetch(`${url}/rest/v1/rpc/save_tournament`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pw, new_state: state, base_rev: baseRev }),
    });

    // the function raises on a bad password, which PostgREST surfaces as 4xx/5xx
    if (!r.ok) return res.status(403).json({ error: "denied" });

    const rev = await r.json();
    if (rev === -1) return res.status(409).json({ error: "conflict" });
    return res.status(200).json({ rev });
  } catch (e) {
    return res.status(502).json({ error: "upstream" });
  }
}
