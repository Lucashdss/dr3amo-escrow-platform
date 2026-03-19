"use client";

import { useCallback, useState } from "react";

import { createUser } from "@/features/auth/services/userApi";

type UsernameRegistrationState = {
  handleCreateUser: () => Promise<void>;
  isCreatingUser: boolean;
  resetUsername: () => void;
  setUsername: (value: string) => void;
  username: string;
  usernameError: string | null;
};

export function useUsernameRegistration(
  address: string | undefined,
  onSuccess: () => void
): UsernameRegistrationState {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = useCallback(async (): Promise<void> => {
    if (!address) {
      setUsernameError("Wallet is not connected.");
      return;
    }

    if (!username.trim()) {
      setUsernameError("Username is required.");
      return;
    }

    setIsCreatingUser(true);
    setUsernameError(null);

    try {
      await createUser({ username, walletAddress: address });
      setUsername("");
      onSuccess();
    } catch (error) {
      setUsernameError(
        error instanceof Error ? error.message : "Failed to create user."
      );
    } finally {
      setIsCreatingUser(false);
    }
  }, [address, onSuccess, username]);

  const resetUsername = useCallback(() => {
    setUsername("");
    setUsernameError(null);
  }, []);

  return {
    handleCreateUser,
    isCreatingUser,
    resetUsername,
    setUsername,
    username,
    usernameError,
  };
}
