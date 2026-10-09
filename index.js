const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
  });
}

function cleanString(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeRecord(body) {
  const kl_name = cleanString(body.kl_name, 200);
  if (!kl_name) throw new Error("Nama K/L wajib diisi.");
  const budget = Number(body.budget ?? 0);
  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error("Anggaran harus berupa angka nol atau lebih.");
  }
  return {
    kl_code: cleanString(body.kl_code, 30),
    kl_name,
    program_name: cleanString(body.program_name, 300),
    activity_name: cleanString(body.activity_name, 300),
    output_name: cleanString(body.output_name, 300),
    unit_name: cleanString(body.unit_name, 100),
    budget,
    notes: cleanString(body.notes, 2000),
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        if (!env.DB) return json({ error: "Binding D1 belum dikonfigurasi." }, 500);

        if (url.pathname === "/api/records" && request.method === "GET") {
          const q = cleanString(url.searchParams.get("q"), 200);
          const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 500), 1), 2000);
          const result = q
            ? await env.DB.prepare(`SELECT * FROM records
                WHERE kl_code LIKE ? OR kl_name LIKE ? OR program_name LIKE ?
                   OR activity_name LIKE ? OR output_name LIKE ?
                ORDER BY id DESC LIMIT ?`)
                .bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit).all()
            : await env.DB.prepare("SELECT * FROM records ORDER BY id DESC LIMIT ?").bind(limit).all();
          return json({ records: result.results || [] });
        }

        if (url.pathname === "/api/summary" && request.method === "GET") {
          const totals = await env.DB.prepare(
            "SELECT COUNT(*) AS total_records, COALESCE(SUM(budget),0) AS total_budget, COUNT(DISTINCT kl_code || ':' || kl_name) AS total_kl FROM records"
          ).first();
          const byKl = await env.DB.prepare(
            "SELECT kl_name, SUM(budget) AS budget, COUNT(*) AS record_count FROM records GROUP BY kl_name ORDER BY budget DESC LIMIT 10"
          ).all();
          return json({ totals, byKl: byKl.results || [] });
        }

        if (url.pathname === "/api/records" && request.method === "POST") {
          const body = normalizeRecord(await request.json());
          const result = await env.DB.prepare(
            `INSERT INTO records (kl_code, kl_name, program_name, activity_name, output_name, unit_name, budget, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(body.kl_code, body.kl_name, body.program_name, body.activity_name,
                 body.output_name, body.unit_name, body.budget, body.notes).run();
          return json({ ok: true, id: result.meta?.last_row_id });
        }

        const match = url.pathname.match(/^\/api\/records\/(\d+)$/);
        if (match && request.method === "PUT") {
          const id = Number(match[1]);
          const body = normalizeRecord(await request.json());
          const result = await env.DB.prepare(
            `UPDATE records SET kl_code=?, kl_name=?, program_name=?, activity_name=?,
             output_name=?, unit_name=?, budget=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
          ).bind(body.kl_code, body.kl_name, body.program_name, body.activity_name,
                 body.output_name, body.unit_name, body.budget, body.notes, id).run();
          return json({ ok: true, changes: result.meta?.changes || 0 });
        }

        if (match && request.method === "DELETE") {
          const result = await env.DB.prepare("DELETE FROM records WHERE id=?").bind(Number(match[1])).run();
          return json({ ok: true, changes: result.meta?.changes || 0 });
        }

        if (url.pathname === "/api/import" && request.method === "POST") {
          const body = await request.json();
          if (!Array.isArray(body.records)) return json({ error: "Format impor tidak valid." }, 400);
          if (body.records.length > 2000) return json({ error: "Maksimal 2.000 baris per impor." }, 400);
          let imported = 0;
          const insert = env.DB.prepare(
            `INSERT INTO records (kl_code, kl_name, program_name, activity_name, output_name, unit_name, budget, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          );
          const batch = [];
          for (const raw of body.records) {
            try {
              const r = normalizeRecord(raw);
              batch.push(insert.bind(r.kl_code, r.kl_name, r.program_name, r.activity_name, r.output_name, r.unit_name, r.budget, r.notes));
            } catch (e) { /* baris tidak valid dilewati; jumlah dilaporkan */ }
          }
          if (batch.length) {
            for (let i = 0; i < batch.length; i += 100) {
              await env.DB.batch(batch.slice(i, i + 100));
            }
            imported = batch.length;
          }
          return json({ ok: true, imported, skipped: body.records.length - imported });
        }

        return json({ error: "Endpoint tidak ditemukan." }, 404);
      } catch (error) {
        return json({ error: error.message || "Terjadi kesalahan server." }, 400);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
