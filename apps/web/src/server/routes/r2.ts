import { Hono } from "hono";
import { AwsClient } from "aws4fetch";
import type { AppEnv } from "@/lib/vid";
import { requireVid } from "@/lib/vid";
import { rateLimit } from "@/lib/rate-limit";

/**
 * R2(DEMO_BUCKET)デモ。すべて `demo/{vid}/` prefix に閉じる。
 * list / object(GET Range・PUT≤2MB・DELETE)/ metadata(条件付き 304)/ presign を提供。
 */
const PREFIX = (vid: string) => `demo/${vid}/`;
const OBJECT_MAX_BYTES = 2 * 1024 * 1024;
const NAME_RE = /^[A-Za-z0-9._-]{1,128}$/;
const BUCKET_NAME = "cf-stack-lab";

export const r2Routes = new Hono<AppEnv>();

r2Routes.use("*", requireVid);

/** ?key のオブジェクト名を検証して vid 名前空間付きフルキーを返す。不正なら null。 */
function fullKey(vid: string, name: string | undefined): string | null {
  if (!name || !NAME_RE.test(name)) return null;
  return `${PREFIX(vid)}${name}`;
}

/**
 * Range ヘッダを R2Range(POJO)へパースする。
 * 注意: `c.req.raw.headers`(Headers オブジェクト)をそのまま R2 の range に渡すと、
 * OpenNext の binding プロキシが devalue で引数を直列化できず 500 になる。必ず POJO 化する。
 */
function parseRange(header: string | undefined): R2Range | undefined {
  if (!header) return undefined;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return undefined;
  const [, startStr, endStr] = m;
  if (startStr === "" && endStr === "") return undefined;
  if (startStr === "") return { suffix: Number(endStr) }; // 末尾 N バイト
  const offset = Number(startStr);
  if (endStr === "") return { offset }; // offset 以降すべて
  return { offset, length: Number(endStr) - offset + 1 };
}

// 一覧(prefix 強制 + メタデータ込み)。
r2Routes.get("/list", async (c) => {
  const vid = c.get("vid");
  const cursor = c.req.query("cursor") || undefined;
  const listed = await c.env.DEMO_BUCKET.list({
    prefix: PREFIX(vid),
    cursor,
    include: ["httpMetadata", "customMetadata"],
    limit: 100,
  });
  const prefix = PREFIX(vid);
  return c.json({
    objects: listed.objects.map((o) => ({
      name: o.key.slice(prefix.length),
      size: o.size,
      uploaded: o.uploaded,
      etag: o.httpEtag,
      contentType: o.httpMetadata?.contentType ?? null,
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : null,
  });
});

// メタデータ(条件付きリクエスト)。If-None-Match が一致すれば 304。
r2Routes.get("/metadata", async (c) => {
  const key = fullKey(c.get("vid"), c.req.query("key"));
  if (!key) return c.json({ error: "invalid_name" }, 400);
  const object = await c.env.DEMO_BUCKET.head(key);
  if (!object) return c.json({ error: "not_found" }, 404);
  if (c.req.header("If-None-Match") === object.httpEtag) {
    return c.body(null, 304, { etag: object.httpEtag });
  }
  return c.json({
    name: c.req.query("key"),
    size: object.size,
    uploaded: object.uploaded,
    etag: object.httpEtag,
    contentType: object.httpMetadata?.contentType ?? null,
  });
});

// 取得(Range 透過。指定時は 206 + Content-Range)。
r2Routes.get("/object", async (c) => {
  const key = fullKey(c.get("vid"), c.req.query("key"));
  if (!key) return c.json({ error: "invalid_name" }, 400);

  const range = parseRange(c.req.header("Range"));
  const object = await c.env.DEMO_BUCKET.get(key, range ? { range } : undefined);
  if (!object) return c.json({ error: "not_found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");

  if (range && object.range && "offset" in object.range) {
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - offset;
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }
  return new Response(object.body, { status: 200, headers });
});

// 保存(≤2MB)。Content-Type を httpMetadata に保存。
r2Routes.put("/object", rateLimit("r2-write", 20, 60), async (c) => {
  const key = fullKey(c.get("vid"), c.req.query("key"));
  if (!key)
    return c.json({ error: "invalid_name", message: "名前は英数字 . _ - の1〜128文字。" }, 400);

  const buf = await c.req.arrayBuffer();
  if (buf.byteLength > OBJECT_MAX_BYTES) {
    return c.json(
      { error: "object_too_large", message: "オブジェクトは 2MB 以下にしてください。" },
      413
    );
  }
  const contentType = c.req.header("Content-Type") ?? "application/octet-stream";
  const object = await c.env.DEMO_BUCKET.put(key, buf, { httpMetadata: { contentType } });
  return c.json({
    name: c.req.query("key"),
    size: object?.size ?? buf.byteLength,
    etag: object?.httpEtag,
  });
});

// 削除。
r2Routes.delete("/object", rateLimit("r2-write", 20, 60), async (c) => {
  const key = fullKey(c.get("vid"), c.req.query("key"));
  if (!key) return c.json({ error: "invalid_name" }, 400);
  await c.env.DEMO_BUCKET.delete(key);
  return c.json({ name: c.req.query("key"), ok: true });
});

// presigned URL(S3 互換)。シークレット未設定ならデモを止めず 501 + 解説を返す。
r2Routes.get("/presign", async (c) => {
  const key = fullKey(c.get("vid"), c.req.query("key"));
  if (!key) return c.json({ error: "invalid_name" }, 400);

  const secrets = c.env as unknown as {
    R2_S3_ACCESS_KEY_ID?: string;
    R2_S3_SECRET_ACCESS_KEY?: string;
    R2_S3_ACCOUNT_ID?: string;
  };
  if (
    !secrets.R2_S3_ACCESS_KEY_ID ||
    !secrets.R2_S3_SECRET_ACCESS_KEY ||
    !secrets.R2_S3_ACCOUNT_ID
  ) {
    return c.json(
      {
        error: "not_configured",
        message:
          "presign には R2 の S3 認証情報が必要です。`wrangler secret put` で R2_S3_ACCESS_KEY_ID / R2_S3_SECRET_ACCESS_KEY / R2_S3_ACCOUNT_ID を設定してください(R2 → Manage R2 API Tokens で発行)。",
      },
      501
    );
  }

  const client = new AwsClient({
    accessKeyId: secrets.R2_S3_ACCESS_KEY_ID,
    secretAccessKey: secrets.R2_S3_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const expiresIn = 300;
  const endpoint = `https://${secrets.R2_S3_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}?X-Amz-Expires=${expiresIn}`;
  const signed = await client.sign(endpoint, { method: "GET", aws: { signQuery: true } });
  return c.json({ url: signed.url, expiresIn });
});
