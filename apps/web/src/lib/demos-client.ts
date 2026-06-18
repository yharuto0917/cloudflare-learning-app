/**
 * web → demos worker への通信層。
 *
 * 分岐は **決定論的**(プローブしない)に行う:
 * - `next dev`(NODE_ENV=development)や `DEMOS_API_URL` 明示時は HTTP で localhost:8787 を叩く。
 *   `next dev` はクロスプロセスの service binding を保証しないため。`pnpm dev` が demos worker も
 *   同時起動する前提。
 * - それ以外(本番 / preview:full の workerd)は Service Binding(`env.DEMOS`)経由で呼ぶ。
 */
export async function demosFetch(
  env: CloudflareEnv,
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (process.env.NODE_ENV === "development" || process.env.DEMOS_API_URL) {
    const base = process.env.DEMOS_API_URL ?? "http://localhost:8787";
    return fetch(`${base}${path}`, init);
  }
  // service binding 経由。host は何でもよい(binding が demos worker へ直結する)。
  return env.DEMOS.fetch(new Request(`https://demos.internal${path}`, init));
}
