import { ChatWidget } from '@/components/ChatWidget/ChatWidget';

export default function DemoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-semibold tracking-tight">
          Chat Widget Playground
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Interact with the embeddable chat widget below. Launch the floating variant
          from the button in the bottom-right corner, or use the inline widget to test
          accessibility, streaming, and memory features. The widget proxies all traffic
          to the existing <code>/chat</code> service and enriches requests with client
          and optional server memory.
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold">Embedded Widget</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Drop the widget into any page component to offer inline conversational help.
          </p>
          <div className="mt-4">
            <ChatWidget mode="embedded" />
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold">Floating Widget</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The launcher lives in the bottom-right and preserves session history between
            visits (subject to local storage retention).
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Use the bubble sitting in the viewport corner to open the floating panel.
          </div>
        </article>
      </section>

      <ChatWidget mode="floating" />
    </main>
  );
}
