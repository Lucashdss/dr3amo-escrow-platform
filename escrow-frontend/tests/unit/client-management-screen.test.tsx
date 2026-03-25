import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ClientManagementScreenContent } from "@/features/escrows/components/ClientManagementScreen";

jest.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined }),
}));

jest.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ isLoading: false, user: null }),
}));

jest.mock("@/features/escrows/hooks/useEscrowManagementList", () => ({
  useEscrowManagementList: () => ({
    error: null,
    escrows: [],
    isLoading: false,
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

const displayValues = {
  displayName: "client",
  profileInitial: "C",
  trimmedAddress: "0x1234...abcd",
};

describe("ClientManagementScreenContent", () => {
  it("renders the loading state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementScreenContent, {
        displayValues,
        errorMessage: null,
        escrows: [],
        hasUser: true,
        isLoading: true,
      })
    );

    expect(html).toContain("Loading related escrows...");
  });

  it("renders the empty state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementScreenContent, {
        displayValues,
        errorMessage: null,
        escrows: [],
        hasUser: true,
        isLoading: false,
      })
    );

    expect(html).toContain("No escrows are related to this user yet.");
  });

  it("renders populated escrow cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementScreenContent, {
        displayValues,
        errorMessage: null,
        escrows: [
          {
            id: 7,
            amount: "0",
            chainId: 1,
            clientUsername: "client",
            contractAddress: "0x0000000000000000000000000000000000000010",
            createdAt: "2026-03-16T00:00:00.000Z",
            deadline: "2026-03-20",
            escrowName: "Landing page refresh",
            freelancerUsername: "freelancer",
            role: "client",
            state: "created",
            tokenAddress: "0x0000000000000000000000000000000000000020",
            tokenId: 1,
          },
        ],
        hasUser: true,
        isLoading: false,
      })
    );

    expect(html).toContain("Landing page refresh");
    expect(html).toContain("Seller");
    expect(html).toContain("Manage Escrow");
    expect(html).toContain('href="/client/management/7"');
  });
});
