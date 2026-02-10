"use client";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-5 grid-rows-5 gap-2">
        <div className="row-span-5 rounded bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-500">
            <span className="text-base font-medium">Search</span>
          </div>

          <div className="mt-6 space-y-2">
            <button className="w-full rounded-xl bg-slate-100 px-4 py-3 text-left text-base font-semibold text-slate-900">
              Overview
            </button>

            <button className="w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-slate-600 hover:bg-slate-50">
              Settings
            </button>
          </div>
        </div>
        <div className="col-span-4 row-span-2 rounded bg-white p-4 text-lg font-semibold">
          <h2 className="text-xl font-semibold text-slate-900">
            Hello, user
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="text-4xl font-semibold text-slate-900">0</div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  active escrows
                </div>
                <div className="text-xs text-slate-400">Last 24h</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="text-4xl font-semibold text-slate-900">0</div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  amount to receive
                </div>
                <div className="text-xs text-slate-400">Last 24h</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="text-4xl font-semibold text-slate-900">0</div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  amount to release
                </div>
                <div className="text-xs text-slate-400">Last 24h</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="text-4xl font-semibold text-slate-900">0</div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  waiting to deliver
                </div>
                <div className="text-xs text-slate-400">Last 24h</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-3 row-span-3 col-start-2 row-start-3 rounded bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-slate-900">
              My escrows
            </h3>
            <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <span className="text-lg leading-none">+</span>
              Create new escrow
            </button>
          </div>
        </div>
        <aside className="row-span-3 col-start-5 row-start-3 rounded bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-2xl font-semibold text-slate-900">
            Last activities
          </h3>
        </aside>
      </div>
    </div>
  );
}
