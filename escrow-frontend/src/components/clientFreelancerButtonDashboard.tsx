import Link from "next/link";

export function ClientFreelancerButtonDashboard() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/client"
        className="rounded-xl bg-white px-6 py-2 font-semibold text-[#2f3136] shadow-sm transition hover:bg-zinc-100"
      >
        Buyer
      </Link>
      <Link
        href="/freelancer"
        className="rounded-xl bg-white px-6 py-2 font-semibold text-[#2f3136] shadow-sm transition hover:bg-zinc-100"
      >
        Seller
      </Link>
    </div>
  );
}
