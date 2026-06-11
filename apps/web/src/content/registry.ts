export interface Lesson {
  slug: string;
  title: string;
  demo?: string; // Optional DemoId
  draft?: boolean;
}

export interface Module {
  id: string; // "m0".."m8", immutable progress cookie key
  slug: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const registry: Module[] = [
  {
    id: "m0",
    slug: "intro",
    title: "はじめに",
    description:
      "Cloudflare 開発者プラットフォームの基礎知識と環境構築、サイト設計の全貌を学びます。",
    lessons: [
      { slug: "platform-overview", title: "Cloudflare 開発者プラットフォーム全体像" },
      { slug: "setup", title: "環境構築と Wrangler v4 基礎" },
      { slug: "site-architecture", title: "このサイトのアーキテクチャ解説" },
    ],
  },
  {
    id: "m1",
    slug: "workers",
    title: "M1: Cloudflare Workers",
    description: "V8 isolates アーキテクチャとエッジでの動的プログラム実行の基本を習得します。",
    lessons: [
      { slug: "isolates", title: "V8 isolate アーキテクチャ", draft: true },
      { slug: "first-worker", title: "fetch handler", draft: true },
      { slug: "env-ctx", title: "bindings の env", draft: true },
      { slug: "routing-hono", title: "素の URL ルーティング", draft: true },
      { slug: "request-cf", title: "request.cf", draft: true },
      { slug: "service-bindings-rpc", title: "Service Bindings", draft: true },
      { slug: "cron-limits-observability", title: "cron triggers", draft: true },
    ],
  },
  {
    id: "m2",
    slug: "opennext",
    title: "M2: OpenNext.js",
    description:
      "Next.js アプリケーションを Cloudflare Workers 上で OpenNext を用いて動かす手法を学びます。",
    lessons: [
      { slug: "why-opennext", title: "Why OpenNext?", draft: true },
      { slug: "setup", title: "Setup", draft: true },
      { slug: "get-cloudflare-context", title: "Cloudflare Context", draft: true },
      { slug: "caching", title: "Caching", draft: true },
      { slug: "static-assets", title: "Static Assets", draft: true },
      { slug: "constraints-ops", title: "Constraints and Ops", draft: true },
    ],
  },
  {
    id: "m3",
    slug: "kv",
    title: "M3: Workers KV",
    description:
      "エッジにキャッシュされる結果整合性 Key-Value ストアの仕組みと実装パターンを学びます。",
    lessons: [
      { slug: "concepts", title: "KV とは", draft: true },
      { slug: "crud", title: "get/put/delete", draft: true },
      { slug: "list-pagination", title: "list と pagination", draft: true },
      { slug: "consistency", title: "結果整合性の深掘り", draft: true },
      { slug: "limits-pricing-patterns", title: "制限・料金・パターン", draft: true },
    ],
  },
  {
    id: "m4",
    slug: "r2",
    title: "M4: Cloudflare R2",
    description: "Egress（データ転送）手数料無料の S3 互換オブジェクトストレージを習得します。",
    lessons: [
      { slug: "concepts", title: "R2 とは", draft: true },
      { slug: "binding-api", title: "put/get/head/delete", draft: true },
      {
        slug: "list-metadata-conditional-range",
        title: "list, metadata, conditional, range",
        draft: true,
      },
      { slug: "presigned-urls", title: "presigned URLs", draft: true },
      {
        slug: "multipart-lifecycle-cors-notifications",
        title: "multipart, lifecycle, CORS, notifications",
        draft: true,
      },
      { slug: "public-buckets-pricing", title: "public buckets, pricing", draft: true },
    ],
  },
  {
    id: "m5",
    slug: "d1",
    title: "M5: Cloudflare D1 + Drizzle",
    description:
      "Cloudflare のリレーショナル SQLite データベースである D1 と Drizzle ORM の強力な連携を学びます。",
    lessons: [
      { slug: "concepts", title: "D1 とは", draft: true },
      { slug: "setup-raw-sql", title: "D1のセットアップとRaw SQL", draft: true },
      { slug: "drizzle-intro", title: "Drizzle の導入", draft: true },
      { slug: "migrations", title: "migrations", draft: true },
      { slug: "queries", title: "queries", draft: true },
      { slug: "local-dev-studio", title: "local dev and studio", draft: true },
      {
        slug: "replication-timetravel-limits",
        title: "replication, timetravel, limits",
        draft: true,
      },
    ],
  },
  {
    id: "m6",
    slug: "durable-objects",
    title: "M6: Durable Objects",
    description:
      "強整合性を持ち、インメモリ状態とストレージを併せ持つ分散ステートフルな Durable Objects をマスターします。",
    lessons: [
      { slug: "concepts", title: "Durable Objects とは", draft: true },
      { slug: "setup-state", title: "Durable Objects のセットアップ", draft: true },
      { slug: "sqlite-storage", title: "sqlite storage", draft: true },
      { slug: "websocket-hibernation", title: "websocket hibernation", draft: true },
      { slug: "alarms", title: "alarms", draft: true },
      { slug: "patterns", title: "patterns", draft: true },
      { slug: "lifecycle-pricing", title: "lifecycle & pricing", draft: true },
    ],
  },
  {
    id: "m7",
    slug: "containers",
    title: "M7: Cloudflare Containers",
    description:
      "Docker イメージをエッジで直接実行可能な新しいコンピューティングレイヤーである Cloudflare Containers を学びます。",
    lessons: [
      { slug: "concepts", title: "Containers とは", draft: true },
      { slug: "setup", title: "wrangler containers 設定", draft: true },
      { slug: "container-class", title: "Container class", draft: true },
      { slug: "routing-patterns", title: "routing patterns", draft: true },
      { slug: "lifecycle-disk", title: "lifecycle disk", draft: true },
      { slug: "local-dev-deploy", title: "local dev deploy", draft: true },
      { slug: "limits-pricing-sandbox", title: "limits pricing sandbox", draft: true },
    ],
  },
  {
    id: "m8",
    slug: "flagship",
    title: "M8: Cloudflare Flagship",
    description:
      "SQLite DO と KV を基盤にした超高速なフィーチャーフラグ・評価システム Flagship を習得します。",
    lessons: [
      { slug: "concepts", title: "Flagship とは", draft: true },
      { slug: "setup", title: "setup", draft: true },
      { slug: "evaluation-api", title: "evaluation API", draft: true },
      { slug: "targeting-rollouts", title: "targeting & rollouts", draft: true },
      { slug: "sdk-limits-best-practices", title: "SDK, limits, best practices", draft: true },
    ],
  },
];

interface FlatLesson {
  moduleSlug: string;
  lessonSlug: string;
  lesson: Lesson;
}

export function getPublishedLessons(): FlatLesson[] {
  const flat: FlatLesson[] = [];
  for (const mod of registry) {
    for (const lesson of mod.lessons) {
      if (!lesson.draft) {
        flat.push({
          moduleSlug: mod.slug,
          lessonSlug: lesson.slug,
          lesson,
        });
      }
    }
  }
  return flat;
}

export function findLesson(
  pathname: string
): { module: Module; lesson: Lesson; lessonIndex: number } | null {
  const parts = pathname.split("/").filter(Boolean);
  let moduleSlug = "";
  let lessonSlug = "";

  if (parts[0] === "learn") {
    moduleSlug = parts[1];
    lessonSlug = parts[2];
  } else {
    moduleSlug = parts[0];
    lessonSlug = parts[1];
  }

  if (!moduleSlug || !lessonSlug) return null;

  const mod = registry.find((m) => m.slug === moduleSlug);
  if (!mod) return null;

  const lessonIndex = mod.lessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) return null;

  return {
    module: mod,
    lesson: mod.lessons[lessonIndex],
    lessonIndex,
  };
}

export function lessonHref(moduleSlug: string, lessonSlug: string): string {
  return `/learn/${moduleSlug}/${lessonSlug}`;
}

export function prevNext(moduleSlug: string, lessonSlug: string) {
  const published = getPublishedLessons();
  const currentIndex = published.findIndex(
    (item) => item.moduleSlug === moduleSlug && item.lessonSlug === lessonSlug
  );

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const prev = currentIndex > 0 ? published[currentIndex - 1] : null;
  const next = currentIndex < published.length - 1 ? published[currentIndex + 1] : null;

  return {
    prev: prev
      ? {
          href: `/learn/${prev.moduleSlug}/${prev.lessonSlug}`,
          title: prev.lesson.title,
        }
      : null,
    next: next
      ? {
          href: `/learn/${next.moduleSlug}/${next.lessonSlug}`,
          title: next.lesson.title,
        }
      : null,
  };
}

export function publishedLessonCount(moduleId: string): number {
  const mod = registry.find((m) => m.id === moduleId);
  if (!mod) return 0;
  return mod.lessons.filter((l) => !l.draft).length;
}
