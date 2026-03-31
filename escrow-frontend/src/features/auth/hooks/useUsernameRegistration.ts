"use client";

import { useCallback, useState } from "react";

import { createUser } from "@/features/auth/services/userApi";
import { MAX_USERNAME_LENGTH } from "@/features/auth/types/user";

type UsernameRegistrationState = {
  handleCreateUser: () => Promise<void>;
  isCreatingUser: boolean;
  resetUsername: () => void;
  setUsername: (value: string) => void;
  username: string;
  usernameError: string | null;
};

export function useUsernameRegistration(
  onSuccess: () => void
): UsernameRegistrationState {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = useCallback(async (): Promise<void> => {
    if (!username.trim()) {
      setUsernameError("Username is required.");
      return;
    }

    if (username.trim().length > MAX_USERNAME_LENGTH) {
      setUsernameError(
        `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`
      );
      return;
    }

    setIsCreatingUser(true);
    setUsernameError(null);

    try {
      await createUser({ username });
      setUsername("");
      onSuccess();
    } catch (error) {
      setUsernameError(
        error instanceof Error ? error.message : "Failed to create user."
      );
    } finally {
      setIsCreatingUser(false);
    }
  }, [onSuccess, username]);

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
