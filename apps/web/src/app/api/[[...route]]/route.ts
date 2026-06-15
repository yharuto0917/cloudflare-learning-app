import { Hono } from "hono";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { miscRoutes } from "@/server/routes/misc";
import { kvRoutes } from "@/server/routes/kv";
import { r2Routes } from "@/server/routes/r2";
import { d1Routes } from "@/server/routes/d1";
import { doRoutes } from "@/server/routes/do";
import { containerRoutes } from "@/server/routes/container";
import { flagshipRoutes } from "@/server/routes/flagship";

// バインディングへアクセスするため動的実行を強制(ビルド時プリレンダ回避)。
export const dynamic = "force-dynamic";

// API 層は単一 Hono アプリに集約する。サブルーターを /api 配下にマウント。
const app = new Hono<{ Bindings: CloudflareEnv }>().basePath("/api");

app.route("/", miscRoutes); // /api/health
app.route("/demos/kv", kvRoutes); // /api/demos/kv/:key
app.route("/demos/r2", r2Routes);
app.route("/demos/d1", d1Routes);
app.route("/demos/do", doRoutes);
app.route("/demos/container", containerRoutes);
app.route("/demos/flagship", flagshipRoutes);

// hono/vercel の handle() は env を渡さないため使わない。
// OpenNext の getCloudflareContext() から env/ctx を取り出して app.fetch に渡す。
const handler = async (req: Request): Promise<Response> => {
  const { env, ctx } = await getCloudflareContext({ async: true });
  return app.fetch(req, env, ctx);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
