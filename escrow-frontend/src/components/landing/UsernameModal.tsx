import { MAX_USERNAME_LENGTH } from "@/features/auth/types/user";

type UsernameModalProps = Readonly<{
  isOpen: boolean;
  username: string;
  usernameError: string | null;
  isCreatingUser: boolean;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}>;

export function UsernameModal({
  isOpen,
  username,
  usernameError,
  isCreatingUser,
  onUsernameChange,
  onSubmit,
}: UsernameModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1f2c3d] p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white">Create Username</h2>
        <p className="mt-2 text-sm text-white/70">
          Your wallet is connected, but no user exists yet.
        </p>

        <label htmlFor="username" className="mt-5 block text-sm text-white/80">
          Username
        </label>
        <input
          id="username"
          type="text"
          maxLength={MAX_USERNAME_LENGTH}
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="Enter your username"
          className="mt-2 w-full rounded-xl border border-white/20 bg-[#162334] px-4 py-3 text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
        />

        {usernameError ? (
          <p className="mt-3 text-sm text-red-400">{usernameError}</p>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isCreatingUser}
          className="mt-6 w-full rounded-full bg-white px-4 py-3 text-base font-semibold text-[#1f2c3d] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatingUser ? "Creating..." : "Create Account"}
        </button>
      </div>
    </div>
  );
}
