"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
            <button
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
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

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Create new escrow
              </h3>
              <button
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setIsCreateOpen(false)}
                type="button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="freelancerAddress"
                  className="text-sm font-semibold text-slate-700"
                >
                  Freelancer address
                </label>
                <input
                  id="freelancerAddress"
                  name="freelancerAddress"
                  type="text"
                  placeholder="0x..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="deadline"
                  className="text-sm font-semibold text-slate-700"
                >
                  Deadline
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="chain"
                  className="text-sm font-semibold text-slate-700"
                >
                  Chain
                </label>
                <select
                  id="chain"
                  name="chain"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select a chain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="token"
                  className="text-sm font-semibold text-slate-700"
                >
                  Token
                </label>
                <select
                  id="token"
                  name="token"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select a token</option>
                  <option value="usdc">USDC</option>
                  <option value="usdt">USDT</option>
                  <option value="eth">ETH</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
                  type="submit"
                >
                  Create escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
