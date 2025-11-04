import type { SourceCitation } from '@/lib/types';

type SourcesProps = {
  sources: SourceCitation[];
};

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const Sources = ({ sources }: SourcesProps) => {
  if (!sources || sources.length === 0) {
    return null;
  }
  return (
    <aside className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Sources
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {sources.length} {sources.length === 1 ? 'reference' : 'references'}
        </span>
      </div>
      <ul className="grid gap-3">
        {sources.map((source) => (
          <li
            key={source.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="cw-focus-ring block"
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {source.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{getDomain(source.url)}</p>
              {source.snippet ? (
                <p className="mt-2 overflow-hidden text-ellipsis text-xs text-slate-500 dark:text-slate-400">
                  {source.snippet}
                </p>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};
