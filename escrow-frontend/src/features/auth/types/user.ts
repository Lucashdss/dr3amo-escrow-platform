export type UserRecord = {
  id: number;
  username: string;
  wallet_address: string;
  created_at: string;
};

export type UserLookupResponse = {
  exists: boolean;
  user: UserRecord | null;
};

export type CreateUserRequest = {
  username: string | null;
};

export type CreateUserResult = {
  message: string;
  user: UserRecord | null;
};

export type UserListResult = {
  users: UserRecord[];
};
