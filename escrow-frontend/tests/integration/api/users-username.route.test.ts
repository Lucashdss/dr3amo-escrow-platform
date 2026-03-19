const mockFindUserByUsername = jest.fn();

jest.mock("@/features/auth/server/userRepository", () => ({
  findUserByUsername: (...args: unknown[]) => mockFindUserByUsername(...args),
}));

import { GET } from "@/app/api/users/username/route";

describe("/api/users/username route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 when username query param is missing", async () => {
    const request = new Request("http://localhost/api/users/username");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "username query param is required." },
    });
  });

  it("returns exists=false when user is not found", async () => {
    mockFindUserByUsername.mockResolvedValueOnce(null);

    const request = new Request(
      "http://localhost/api/users/username?username=alice"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(mockFindUserByUsername).toHaveBeenCalledWith("alice");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: { exists: false, user: null },
      error: null,
    });
  });

  it("returns exists=true with user when found", async () => {
    const user = {
      id: 3,
      username: "alice",
      wallet_address: "0xabc",
      created_at: "2026-02-18T00:00:00.000Z",
    };
    mockFindUserByUsername.mockResolvedValueOnce(user);

    const request = new Request(
      "http://localhost/api/users/username?username=alice"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: { exists: true, user },
      error: null,
    });
  });

  it("returns 500 when lookup throws", async () => {
    mockFindUserByUsername.mockRejectedValueOnce(new Error("boom"));

    const request = new Request(
      "http://localhost/api/users/username?username=alice"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      data: null,
      error: { message: "Failed to check username." },
    });
  });
});
