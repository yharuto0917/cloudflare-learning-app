import { Hono } from "hono";
import type { Context } from "hono";
import { getContainer, getRandom } from "@cloudflare/containers";

/** インスタンス名は固定の2つのみ許可(任意名での乱立=コスト増を防ぐ)。 */
const ALLOWED_NAMES = new Set(["alpha", "beta"]);
/** /pool でランダム分散させるインスタンス数。 */
const POOL_SIZE = 3;

/** ?name を検証して返す。未許可なら null。 */
function getName(c: Context<{ Bindings: Env }>): string | null {
  const name = c.req.query("name") ?? "alpha";
  return ALLOWED_NAMES.has(name) ? name : null;
}

function unknownName(c: Context<{ Bindings: Env }>) {
  return c.json({ error: "unknown_name", allowed: [...ALLOWED_NAMES] }, 404);
}

/** コンテナの HTTP サーバーへ proxy するための内部 Request を組み立てる。 */
function containerRequest(path: string, init?: RequestInit): Request {
  return new Request(`http://container${path}`, init);
}

export const containerRoutes = new Hono<{ Bindings: Env }>();

// ---- /info: 指定インスタンスのコンテナ情報(初回はイメージビルド+コールドスタート) ----
containerRoutes.get("/info", async (c) => {
  const name = getName(c);
  if (!name) return unknownName(c);
  // Container.fetch は未起動なら自動で起動しポート待機する(startAndWaitForPorts 相当)。
  const res = await getContainer(c.env.DEMO_CONTAINER, name).fetch(containerRequest("/info"));
  return c.json({ name, info: await res.json() });
});

// ---- /state: DO 視点のコンテナ状態 + ライフサイクルイベントログ ----
containerRoutes.get("/state", async (c) => {
  const name = getName(c);
  if (!name) return unknownName(c);
  const stub = getContainer(c.env.DEMO_CONTAINER, name);
  // getState はコンテナを起動しない(状態照会のみ)。events は DO storage から読む。
  const [state, events] = await Promise.all([stub.getState(), stub.events()]);
  return c.json({ name, state, events });
});

// ---- /pool: N台へランダム分散し、どのインスタンスが応答したか(instanceId)を表示 ----
containerRoutes.get("/pool", async (c) => {
  const stub = await getRandom(c.env.DEMO_CONTAINER, POOL_SIZE);
  const res = await stub.fetch(containerRequest("/info"));
  return c.json({ poolSize: POOL_SIZE, info: await res.json() });
});

// ---- /files: ephemeral disk への書き込み/一覧(destroy で消えることを示す) ----
containerRoutes.post("/files", async (c) => {
  const name = getName(c);
  if (!name) return unknownName(c);
  const body = await c.req.text();
  const res = await getContainer(c.env.DEMO_CONTAINER, name).fetch(
    containerRequest("/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
  );
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});

containerRoutes.get("/files", async (c) => {
  const name = getName(c);
  if (!name) return unknownName(c);
  const res = await getContainer(c.env.DEMO_CONTAINER, name).fetch(containerRequest("/files"));
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});

// ---- /stop: SIGTERM でグレースフル停止 ----
containerRoutes.post("/stop", async (c) => {
  const name = getName(c);
  if (!name) return unknownName(c);
  try {
    await getContainer(c.env.DEMO_CONTAINER, name).stop();
    return c.json({ name, stopped: true });
  } catch (err) {
    return c.json({ name, stopped: false, error: String(err) }, 409);
  }
});

// ---- /destroy: SIGKILL で破棄(ephemeral disk が消えることの確認用) ----
containerRoutes.post("/destroy", async (c) => {
  const name = getName(c);
  if (!name) return unknownName(c);
  try {
    await getContainer(c.env.DEMO_CONTAINER, name).destroy();
    return c.json({ name, destroyed: true });
  } catch (err) {
    return c.json({ name, destroyed: false, error: String(err) }, 409);
  }
});
