"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, UserCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { navItems } from "@/components/dashboard-components";
import { checkUserByWallet, type UserRecord } from "@/features/auth/services/userApi";

const USDCbaseAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDCbaseAddressTest = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const ETHbaseAddress = "0x0000000000000000000000000000000000000000";



export default function ContractCreatePage() {
  const { address } = useAccount();
  const [clientUser, setClientUser] = useState<UserRecord | null>(null);
  const activeNavLabel = "Contracts";

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
              {navItems.map(({ label, icon: Icon }) => {
                const isActive = label === activeNavLabel;

                return label === "Overview" || label === "Contracts" ? (
                  <Link
                    key={label}
                    href={label === "Overview" ? "/client" : "/client/contracts"}
                    aria-label={label}
                    className={`flex h-16 w-16 items-center justify-center rounded-[1.6rem] border transition ${isActive
                      ? "border-white/20 bg-white/12 text-white"
                      : "border-white/10 bg-white/8 text-white/72 hover:bg-white/12"
                      }`}
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                ) : (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    className={`flex h-16 w-16 items-center justify-center rounded-[1.6rem] border transition ${isActive
                      ? "border-white/20 bg-white/12 text-white"
                      : "border-white/10 bg-white/8 text-white/72 hover:bg-white/12"
                      }`}
                  >
                    <Icon className="h-6 w-6" />
                  </button>
                );
              })}
            </nav>
          </div>

          <Link
            href="/client"
            className="flex min-h-16 min-w-0 items-center justify-center gap-3 rounded-[1.8rem] border border-[#b6ef5f]/30 bg-[#b6ef5f]/12 px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#b6ef5f]/18 lg:min-h-[132px] lg:flex-col lg:px-4 lg:text-center"
          >
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#b6ef5f]" />
            <span>Back to dashboard</span>
          </Link>
        </aside>

        <main className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-[#b6ef5f]/20 bg-[#b6ef5f]/10 px-4 py-3 text-sm font-medium text-[#d8f5a7]">
                  Deployment flow
                </div>
              </div>

              <div>
                <h1 className="max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl xl:text-6xl">
                  Create Escrow Contract
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
                  Fill the core deployment fields for the escrow contract before wiring
                  this page into the onchain flow.
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

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <article className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
              <div className="border-b border-white/10 pb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
                  Contract input
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase text-white">
                  Deployment Parameters
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                  Capture the minimum data required to prepare an escrow contract.
                  Chain selection is fixed to Base for this flow.
                </p>
              </div>

              <form className="mt-8 grid gap-5">
                <label className="grid gap-3">
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
                    Freelancer address or username
                  </span>
                  <input
                    type="text"
                    placeholder="0x1234...abcd or freelancer_username"
                    className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[#b6ef5f]/45"
                  />
                  <span className="text-sm leading-6 text-white/45">
                    Accept a 42-character wallet address starting with `0x` and using
                    hexadecimal format, or a platform username.
                  </span>
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
                      Date
                    </span>
                    <input
                      type="date"
                      className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition [color-scheme:dark] focus:border-[#b6ef5f]/45"
                    />
                    <span className="text-sm leading-6 text-white/45">
                      Use the intended escrow start date or the contract deadline, depending
                      on the flow you wire next.
                    </span>
                  </label>

                  <label className="grid gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
                      Chain
                    </span>
                    <input
                      type="text"
                      value="Base"
                      disabled
                      className="cursor-not-allowed rounded-[1.4rem] border border-[#b6ef5f]/20 bg-[#b6ef5f]/10 px-4 py-4 text-base font-semibold text-[#d8f5a7] outline-none"
                    />
                    <span className="text-sm leading-6 text-white/45">
                      This route is locked to Base and should not be editable by the user.
                    </span>
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
                      Funding token
                    </span>
                    <select
                      defaultValue="USDC"
                      className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition focus:border-[#b6ef5f]/45"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                    </select>
                    <span className="text-sm leading-6 text-white/45">
                      Limit funding to the supported assets available in this flow.
                    </span>
                  </label>

                  <label className="grid gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/62">
                      Upfront payment percentage
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="20"
                      className="rounded-[1.4rem] border border-white/10 bg-black/25 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[#b6ef5f]/45"
                    />
                    <span className="text-sm leading-6 text-white/45">
                      Provide a value between 0 and 100 to define how much is released
                      upfront.
                    </span>
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-white/48">
                    This is the intake layer only. Validation and deployment wiring can be
                    added on the next pass.
                  </p>
                  <button
                    type="submit"
                    className="rounded-[1.6rem] border border-[#b6ef5f]/35 bg-[#b6ef5f] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:brightness-105"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </article>

            <aside className="rounded-[2.2rem] border border-white/10 bg-[#171717] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
                Requirements
              </p>
              <h3 className="mt-3 text-2xl font-black uppercase text-white">
                Input Rules
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                    Freelancer target
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    Accept either a username or a valid EVM address in the `0x` + 40 hex
                    characters format.
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                    Base locked
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    The chain field is display-only because this deployment flow is fixed on
                    Base.
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                    Upfront percentage
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    Keep the value between 0 and 100 so the split can be converted into
                    funding logic later.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
