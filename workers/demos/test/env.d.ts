// cloudflare:test の env を本 Worker の Env(DO bindings 等)で型付けする。
// 空インターフェースの宣言マージは cloudflare:test 拡張の定型パターンのため、該当ルールを無効化。
declare module "cloudflare:test" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProvidedEnv extends Env {}
}
