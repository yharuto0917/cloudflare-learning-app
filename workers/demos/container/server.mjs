// 依存ゼロの node:http サーバー。Cloudflare Containers のデモ実体。
// イメージを数秒でビルドできるよう外部依存・lockfile を持たない。
import { createServer } from "node:http";
import { hostname } from "node:os";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const PORT = Number(process.env.PORT ?? 8080);
// プロセス起動時刻。コールドスタート/再配置のたびにリセットされる(=instanceId と合わせて教材)。
const startedAt = Date.now();
// 書き込み先は ephemeral disk(/tmp)。destroy 後に消えることを示すデモ。
const FILES_DIR = "/tmp/demo-files";
const MAX_FILE_BYTES = 1024;
let requestCount = 0;

await mkdir(FILES_DIR, { recursive: true });

/** ランタイムが注入する CLOUDFLARE_* 変数のみを抽出する(教材: DO ID 等が見える)。 */
function cloudflareEnv() {
  const out = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("CLOUDFLARE_")) out[key] = value;
  }
  return out;
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/** リクエストボディを上限付きで読む。上限超過なら reject(コンテナを守る)。 */
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  requestCount += 1;
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  try {
    // ヘルスチェック(pingEndpoint 兼用)。
    if (req.method === "GET" && pathname === "/healthz") {
      return sendJson(res, 200, { ok: true });
    }

    // インスタンス情報。hostname がインスタンスごとに異なる=どの実体が応答したか分かる。
    if (req.method === "GET" && pathname === "/info") {
      return sendJson(res, 200, {
        instanceId: hostname(),
        startedAt,
        uptimeMs: Date.now() - startedAt,
        requestCount,
        env: cloudflareEnv(),
      });
    }

    if (pathname === "/files") {
      // ephemeral disk への書き込み(≤1KB)。
      if (req.method === "POST") {
        let raw;
        try {
          raw = await readBody(req, MAX_FILE_BYTES);
        } catch {
          return sendJson(res, 413, { error: "payload_too_large", maxBytes: MAX_FILE_BYTES });
        }
        let parsed;
        try {
          parsed = JSON.parse(raw || "{}");
        } catch {
          return sendJson(res, 400, { error: "invalid_json" });
        }
        // basename でパストラバーサルを防ぐ。
        const name = basename(String(parsed.name ?? "")).trim();
        const content = String(parsed.content ?? "");
        if (!name || name === "." || name === "..") {
          return sendJson(res, 400, { error: "name_required" });
        }
        await writeFile(join(FILES_DIR, name), content, "utf8");
        return sendJson(res, 201, { written: name, bytes: Buffer.byteLength(content) });
      }

      // 一覧+内容。destroy/再起動後は空になる(ephemeral)。
      if (req.method === "GET") {
        const names = await readdir(FILES_DIR);
        const files = await Promise.all(
          names.map(async (name) => ({
            name,
            content: await readFile(join(FILES_DIR, name), "utf8"),
          }))
        );
        return sendJson(res, 200, { dir: FILES_DIR, files });
      }
    }

    return sendJson(res, 404, { error: "not_found", path: pathname });
  } catch (err) {
    return sendJson(res, 500, { error: "internal_error", message: String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`demo container listening on :${PORT}`);
});
