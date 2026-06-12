interface LinkItem {
  href: string;
  title: string;
  description?: string;
}

interface DocLinksProps {
  links: LinkItem[];
}

export function DocLinks({ links = [] }: DocLinksProps) {
  return (
    <div className="my-8">
      <h4 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider select-none">
        関連公式ドキュメント・資料
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col p-4 rounded-lg border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/60 hover:border-orange-500/50 transition-all group"
          >
            <span className="text-sm font-medium text-neutral-200 group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
              {link.title}
              <span className="text-xs text-neutral-500 group-hover:text-orange-400/70 select-none">
                ↗
              </span>
            </span>
            {link.description && (
              <span className="text-xs text-neutral-500 mt-1 line-clamp-2">{link.description}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
