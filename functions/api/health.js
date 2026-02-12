export async function onRequestGet(context) {
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
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        database: "unreachable",
        error: String(error?.message || error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
