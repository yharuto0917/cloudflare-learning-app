/**
 * Flagship のフィーチャーフラグ評価を防御的にラップするヘルパー。
 *
 * Flagship binding(`env.FLAGS`)は「常に remote」のため、ローカル開発や app_id 未設定では
 * 評価が失敗し得る。また将来 binding を本番 env のみに隔離した場合は `env.FLAGS` 自体が
 * 未バインドになる。いずれの場合も必ず `defaultValue` を返し、アプリが動作し続けるようにする。
 */

export type FlagContext = Record<string, string | number | boolean>;

export async function getBooleanFlag(
  env: CloudflareEnv,
  key: string,
  defaultValue: boolean,
  context?: FlagContext
): Promise<boolean> {
  const flags = (env as { FLAGS?: Flagship }).FLAGS;
  if (!flags) return defaultValue;
  try {
    return await flags.getBooleanValue(key, defaultValue, context);
  } catch {
    return defaultValue;
  }
}

export async function getStringFlag(
  env: CloudflareEnv,
  key: string,
  defaultValue: string,
  context?: FlagContext
): Promise<string> {
  const flags = (env as { FLAGS?: Flagship }).FLAGS;
  if (!flags) return defaultValue;
  try {
    return await flags.getStringValue(key, defaultValue, context);
  } catch {
    return defaultValue;
  }
}

export async function getNumberFlag(
  env: CloudflareEnv,
  key: string,
  defaultValue: number,
  context?: FlagContext
): Promise<number> {
  const flags = (env as { FLAGS?: Flagship }).FLAGS;
  if (!flags) return defaultValue;
  try {
    return await flags.getNumberValue(key, defaultValue, context);
  } catch {
    return defaultValue;
  }
}
