import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ClientManagementDetailScreenContent } from "@/features/escrows/components/ClientManagementDetailScreen";

jest.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
}));

jest.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ isLoading: false, user: null }),
}));

jest.mock("@/features/escrows/hooks/useEscrowManagementDetail", () => ({
  useEscrowManagementDetail: () => ({
    error: null,
    escrow: null,
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

describe("ClientManagementDetailScreenContent", () => {
  it("renders the loading state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        displayValues,
        errorMessage: null,
        escrow: null,
        hasUser: true,
        isLoading: true,
      })
    );

    expect(html).toContain("Loading escrow detail...");
  });

  it("renders the empty state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        displayValues,
        errorMessage: null,
        escrow: null,
        hasUser: true,
        isLoading: false,
      })
    );

    expect(html).toContain("Escrow detail is not available.");
  });

  it("renders populated escrow detail", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        displayValues,
        errorMessage: null,
        escrow: {
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
          tokenId: 1,
        },
        hasUser: true,
        isLoading: false,
      })
    );

    expect(html).toContain("Landing page refresh");
    expect(html).toContain("Back to Management");
    expect(html).toContain("Base");
    expect(html).toContain("USDC");
  });
});
