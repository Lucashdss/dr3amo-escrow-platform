"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, UserCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { activity, kpisFreelancer, navItems, toneClasses } from "@/components/dashboard-components";
import { checkUserByWallet, type UserRecord } from "@/features/auth/services/userApi";

export default function DashboardPage() {
  const { address } = useAccount();
  const [clientUser, setClientUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    if (!address) {
      setClientUser(null);
      return;
    }

    let isCancelled = false;

    const loadClientUser = async () => {
      try {
        const result = await checkUserByWallet(address);

        if (!isCancelled) {
          setClientUser(result.user);
        }
      } catch {
        if (!isCancelled) {
          setClientUser(null);
        }
      }
    };

    void loadClientUser();

    return () => {
      isCancelled = true;
    };
  }, [address]);

  const trimmedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Wallet not connected";
  const displayName = clientUser?.username ?? trimmedAddress;
  const profileInitial = (clientUser?.username?.[0] ?? address?.[2] ?? "C").toUpperCase();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1800px] flex-col bg-black p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
      <div className="grid flex-1 gap-6 lg:grid-cols-[104px_minmax(0,1fr)]">
        <aside className="flex flex-row gap-4 lg:flex-col lg:justify-between">
          <div className="flex flex-1 flex-row items-start gap-4 lg:flex-col">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <div className="text-3xl font-black tracking-[-0.08em]">N</div>
            </div>

            <nav className="flex flex-1 flex-row flex-wrap gap-3 lg:flex-col">
              {navItems.map(({ label, icon: Icon, active }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className={`flex h-16 w-16 items-center justify-center rounded-[1.6rem] border transition ${active
                    ? "border-white/20 bg-white/12 text-white"
                    : "border-white/10 bg-white/8 text-white/72 hover:bg-white/12"
                    }`}
                >
                  <Icon className="h-6 w-6" />
                </button>
              ))}
            </nav>
          </div>

          <Link
            href="#"
            className="flex min-h-16 min-w-0 items-center justify-center gap-3 rounded-[1.8rem] border border-white/10 bg-white/8 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/12 lg:min-h-[132px] lg:flex-col lg:px-4 lg:text-center"
          >
            <Plus className="h-5 w-5 shrink-0" />
            <span>Create and manage escrows</span>
          </Link>
        </aside>

        <main className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/client"
                  className="rounded-full border border-white/10 bg-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65 transition hover:bg-white/12 hover:text-white"
                >
                  Client Dashboard
                </Link>
                <div className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white/72">
                  Visual skeleton
                </div>
              </div>

              <div>
                <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
                  Freelancer Dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                  Track escrow health, contract momentum, review load, and
                  upcoming delivery pressure in one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start rounded-[1.8rem] border border-white/10 bg-white/8 px-4 py-3 lg:self-auto">
              <div className="text-right">
                <p className="text-lg font-bold text-white">{displayName}</p>
                <p className="text-sm text-white/50">{trimmedAddress}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#b6ef5f] via-[#d1f7a0] to-white text-lg font-black text-black">
                {clientUser?.username ? (
                  profileInitial
                ) : (
                  <UserCircle2 className="h-7 w-7" />
                )}
              </div>
            </div>
          </header>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {kpisFreelancer.map(({ label, value, change, tone, icon: Icon }) => (
              <article
                key={label}
                className="rounded-[1.6rem] border border-white/10 bg-[#171717] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone].soft} ${toneClasses[tone].border} border`}
                  >
                    <Icon className={`h-4 w-4 ${toneClasses[tone].text}`} />
                  </div>
                  <span className={`text-[11px] font-semibold ${toneClasses[tone].text}`}>
                    Live view
                  </span>
                </div>
                <p className="mt-6 text-[2rem] font-black tracking-tight text-white">
                  {value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/58">
                  {label}
                </p>
                <p className="mt-4 text-xs leading-5 text-white/52">{change}</p>
              </article>
            ))}
          </section>

          <section className="min-w-0 flex-1">
            <div className="grid min-w-0 gap-6">
              <article className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
                      Feed
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase text-white">
                      Recent Activity
                    </h2>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-white/45" />
                </div>

                <div className="mt-8 space-y-4">
                  {activity.map(({ title, detail, when, tone, icon: Icon }) => (
                    <div
                      key={`${title}-${when}`}
                      className="flex items-start gap-4 rounded-[1.7rem] border border-white/10 bg-black/25 p-4"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone].soft} ${toneClasses[tone].border} border`}
                      >
                        <Icon className={`h-5 w-5 ${toneClasses[tone].text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-bold text-white">{title}</p>
                          <span className="text-sm text-white/42">{when}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/56">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
