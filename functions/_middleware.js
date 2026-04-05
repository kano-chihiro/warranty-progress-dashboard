// --- pages.dev バイパス防止 (Phase 2) ---
const CANONICAL_HOST = "db.noesiskai.com";

// --- レート制限 (Phase 1) ---
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const rateLimitMap = new Map();

function cleanupExpiredEntries(now) {
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.start >= WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const host = request.headers.get("host") || "";

  // pages.dev へのアクセスをカスタムドメインにリダイレクト (localhost は除外)
  if (host.endsWith(".pages.dev")) {
    return Response.redirect(
      `https://${CANONICAL_HOST}${url.pathname}${url.search}`,
      301,
    );
  }

  // /api/* パスのみレート制限を適用
  if (url.pathname.startsWith("/api/")) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();

    // 定期的に期限切れエントリを掃除 (100件を超えたら)
    if (rateLimitMap.size > 100) {
      cleanupExpiredEntries(now);
    }

    const entry = rateLimitMap.get(ip);
    if (entry && now - entry.start < WINDOW_MS) {
      if (entry.count >= RATE_LIMIT) {
        return new Response(
          JSON.stringify({ ok: false, error: "RATE_LIMITED" }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Retry-After": String(Math.ceil((entry.start + WINDOW_MS - now) / 1000)),
            },
          },
        );
      }
      entry.count++;
    } else {
      rateLimitMap.set(ip, { start: now, count: 1 });
    }
  }

  return await context.next();
}
