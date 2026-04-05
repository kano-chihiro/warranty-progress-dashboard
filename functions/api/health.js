const ALLOWED_ORIGINS = [
  "https://db.noesiskai.com",
  "http://localhost:8788",
];

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export async function onRequestGet(context) {
  const headers = {
    ...getCorsHeaders(context.request),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  try {
    await context.env.warranty_progress_db
      .prepare("SELECT 1 AS ok")
      .first();
    return new Response(
      JSON.stringify({
        ok: true,
        database: "reachable",
        time: new Date().toISOString(),
      }),
      { status: 200, headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        database: "unreachable",
        error: String(error?.message || error),
      }),
      { status: 500, headers },
    );
  }
}
