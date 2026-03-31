import {
  parseCreateUserRequest,
  parseUsernameLookupRequest,
} from "@/features/auth/server/userRequests";

describe("user request parsing", () => {
  it("rejects usernames longer than 32 characters during creation", () => {
    expect(
      parseCreateUserRequest({
        username: "a".repeat(33),
      })
    ).toEqual({
      success: false,
      error: "username must be 32 characters or fewer.",
    });
  });

  it("rejects usernames longer than 32 characters during lookup", () => {
    expect(
      parseUsernameLookupRequest(
        new Request(
          `http://localhost/api/users/username?username=${"a".repeat(33)}`
        )
      )
    ).toEqual({
      success: false,
      error: "username must be 32 characters or fewer.",
    });
  });
});
