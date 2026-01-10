import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { consolePages, type ConsolePageId } from './pageRegistry';

function isConsolePageId(x: string): x is ConsolePageId {
  return Object.prototype.hasOwnProperty.call(consolePages, x);
}

export default function PagePreview() {
  const { id } = useParams();
  const pageId = (id || '') as string;

  if (!pageId || !isConsolePageId(pageId)) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Page not found</div>
          <div className="mt-2 text-sm text-slate-600">
            Unknown page id: <span className="font-mono">{pageId || '(missing)'}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Go to landing
            </Link>
            <Link
              to="/console"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Open console
            </Link>
          </div>
          <div className="mt-6 text-xs text-slate-500">
            Tip: valid ids include <span className="font-mono">dashboard</span>, <span className="font-mono">notifications_activity</span>,{" "}
            <span className="font-mono">rfq</span>, etc.
          </div>
        </div>
      </div>
    );
  }

  const Comp = consolePages[pageId as ConsolePageId];
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">Standalone preview</div>
            <div className="text-sm font-semibold text-slate-900">{pageId}</div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/console"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Console
            </Link>
            <Link
              to="/"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Landing
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <Comp />
      </div>
    </div>
  );
}
