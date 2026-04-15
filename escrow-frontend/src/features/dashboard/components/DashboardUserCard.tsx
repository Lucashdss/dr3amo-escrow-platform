import { UserCircle2 } from "lucide-react";

type DashboardUserCardProps = Readonly<{
  displayName: string;
  hasUser: boolean;
  profileInitial: string;
  trimmedAddress: string;
}>;

export function DashboardUserCard({
  displayName,
  hasUser,
  profileInitial,
  trimmedAddress,
}: DashboardUserCardProps) {
  return (
    <div className="flex items-center gap-4 self-start rounded-[1.8rem] border border-white/10 bg-white/8 px-4 py-3 lg:self-auto">
      <div className="text-right">
        <p className="text-lg font-bold text-white">{displayName}</p>
        <p className="text-sm text-white/50">{trimmedAddress}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#b6ef5f] via-[#d1f7a0] to-white text-lg font-black text-black">
        {hasUser ? profileInitial : <UserCircle2 className="h-7 w-7" />}
      </div>
    </div>
  );
}
