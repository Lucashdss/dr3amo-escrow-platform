import { AppError } from "@/lib/errors";
import { normalizeUsername } from "@/lib/normalizers";
import type {
  CreateUserRequest,
  CreateUserResult,
  UserLookupProfile,
  UserLookupResponse,
  UserRecord,
} from "@/features/auth/types/user";

import * as repository from "./userRepository";

type UserRepository = {
  createUserRecord: typeof repository.createUserRecord;
  findUserById: typeof repository.findUserById;
  findUserByUsername: typeof repository.findUserByUsername;
  findUserByWalletAddress: typeof repository.findUserByWalletAddress;
};

const defaultRepository: UserRepository = repository;

async function loadCreatedUser(
  insertId: number,
  repo: UserRepository
): Promise<UserRecord> {
  const user = await repo.findUserById(insertId);

  if (!user) {
    throw new AppError("Failed to load created user.", 500);
  }

  return user;
}

function mapLookupProfile(user: UserRecord | null): UserLookupProfile | null {
  const lookupProfile = user
    ? {
        username: user.username,
        wallet_address: user.wallet_address,
      }
    : null;

  return lookupProfile;
}

export async function findUserByWallet(
  walletAddress: string,
  repo: UserRepository = defaultRepository
): Promise<UserLookupResponse> {
  const user = await repo.findUserByWalletAddress(walletAddress);
  return { exists: Boolean(user), user: mapLookupProfile(user) };
}

export async function findUserByName(
  username: string,
  repo: UserRepository = defaultRepository
): Promise<UserLookupResponse> {
  const user = await repo.findUserByUsername(username);
  return { exists: Boolean(user), user: mapLookupProfile(user) };
}

export async function createUser(
  request: CreateUserRequest,
  walletAddress: string,
  repo: UserRepository = defaultRepository
): Promise<{ status: number; data: CreateUserResult }> {
  const existingUser = await repo.findUserByWalletAddress(walletAddress);

  if (existingUser) {
    return {
      status: 200,
      data: {
        message: "User already exists.",
        user: existingUser,
      },
    };
  }

  const username = normalizeUsername(request.username ?? "");

  if (!username) {
    throw new AppError("username is required for new users.", 400);
  }

  const insertId = await repo.createUserRecord(username, walletAddress);
  const user = await loadCreatedUser(insertId, repo);

  return {
    status: 201,
    data: {
      message: "User created successfully.",
      user,
    },
  };
}
