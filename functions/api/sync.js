const DOC_KEY_TO_TYPE = Object.freeze({
  warrantyDashboardData: "warranty",
  serviceDashboardData: "service",
  reviewDashboardData: "review",
  dashboardViewState: "view_state",
});

const DOC_TYPE_TO_KEY = Object.freeze({
  warranty: "warrantyDashboardData",
  service: "serviceDashboardData",
  review: "reviewDashboardData",
  view_state: "dashboardViewState",
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function getSnapshot(db) {
  const query = await db
    .prepare("SELECT doc_type, payload_json, updated_at, version FROM dashboard_documents")
    .all();

  const result = {
    warrantyDashboardData: null,
    serviceDashboardData: null,
    reviewDashboardData: null,
    dashboardViewState: "warranty",
    meta: {
      versions: {},
      updatedAt: {},
    },
  };

  for (const row of query.results || []) {
    const key = DOC_TYPE_TO_KEY[row.doc_type];
    if (!key) continue;

    let parsedValue;
    try {
      parsedValue = JSON.parse(row.payload_json);
    } catch {
      continue;
    }

    result[key] = parsedValue;
    result.meta.versions[key] = row.version;
    result.meta.updatedAt[key] = row.updated_at;
  }

  return result;
}

function collectDocsFromBody(body) {
  const docs = [];
  for (const [key, docType] of Object.entries(DOC_KEY_TO_TYPE)) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      docs.push({
        key,
        docType,
        value: body[key],
      });
    }
  }
  return docs;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context) {
  const snapshot = await getSnapshot(context.env.warranty_progress_db);
  return jsonResponse({
    ok: true,
    ...snapshot,
  });
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      400,
    );
  }

  const docs = collectDocsFromBody(body || {});
  if (docs.length === 0) {
    return jsonResponse(
      {
        ok: false,
        error: "NO_SYNC_TARGET",
        message:
          "At least one of warrantyDashboardData / serviceDashboardData / reviewDashboardData / dashboardViewState is required.",
      },
      400,
    );
  }

  const db = context.env.warranty_progress_db;
  const nowIso = new Date().toISOString();
  const baseVersions = body?.baseVersions || {};

  const versionsQuery = await db
    .prepare("SELECT doc_type, version FROM dashboard_documents")
    .all();
  const currentVersions = new Map(
    (versionsQuery.results || []).map((row) => [row.doc_type, row.version]),
  );

  const conflicts = [];
  for (const doc of docs) {
    const requestedBaseVersion = baseVersions[doc.key];
    if (requestedBaseVersion == null) continue;

    const currentVersion = currentVersions.get(doc.docType) ?? null;
    if (currentVersion !== requestedBaseVersion) {
      conflicts.push({
        key: doc.key,
        expectedVersion: requestedBaseVersion,
        currentVersion,
      });
    }
  }

  if (conflicts.length > 0) {
    const latest = await getSnapshot(db);
    return jsonResponse(
      {
        ok: false,
        error: "VERSION_CONFLICT",
        conflicts,
        latest,
      },
      409,
    );
  }

  const statements = docs.map((doc) =>
    db
      .prepare(
        `
        INSERT INTO dashboard_documents (doc_type, payload_json, updated_at, version)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(doc_type) DO UPDATE SET
          payload_json = excluded.payload_json,
          updated_at = excluded.updated_at,
          version = dashboard_documents.version + 1
      `,
      )
      .bind(doc.docType, JSON.stringify(doc.value), nowIso),
  );

  await db.batch(statements);

  const snapshot = await getSnapshot(db);
  return jsonResponse({
    ok: true,
    ...snapshot,
  });
}
