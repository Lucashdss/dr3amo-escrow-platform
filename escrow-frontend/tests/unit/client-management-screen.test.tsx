import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  clampEscrowPage,
  ClientManagementScreenContent,
  getEscrowPageCount,
  getEscrowsForPage,
} from "@/features/escrows/components/ClientManagementScreen";
import type { EscrowManagementItem } from "@/features/escrows/types/escrow";

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

function createEscrow(id: number): EscrowManagementItem {
  return {
    id,
    amount: "0",
    chainId: 1,
    clientUsername: "client",
    contractAddress: `0x${id.toString(16).padStart(40, "0")}`,
    createdAt: "2026-03-16T00:00:00.000Z",
    deadline: "2026-03-20",
    escrowName: `Escrow ${id}`,
    freelancerUsername: "freelancer",
    role: "client",
    state: "created",
    tokenAddress: "0x0000000000000000000000000000000000000020",
    tokenId: 1,
  };
}

describe("client management pagination helpers", () => {
  it("calculates the page count in groups of six", () => {
    expect(getEscrowPageCount(0)).toBe(1);
    expect(getEscrowPageCount(6)).toBe(1);
    expect(getEscrowPageCount(7)).toBe(2);
    expect(getEscrowPageCount(13)).toBe(3);
  });

  it("clamps page numbers into the valid range", () => {
    expect(clampEscrowPage(0, 3)).toBe(1);
    expect(clampEscrowPage(2, 3)).toBe(2);
    expect(clampEscrowPage(4, 3)).toBe(3);
  });

  it("returns six escrows per page", () => {
    const escrows = Array.from({ length: 8 }, (_, index) => createEscrow(index + 1));

    expect(getEscrowsForPage(escrows, 1).map((escrow) => escrow.id)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(getEscrowsForPage(escrows, 2).map((escrow) => escrow.id)).toEqual([7, 8]);
  });
});

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
        escrows: [createEscrow(7)],
        hasUser: true,
        isLoading: false,
      })
    );

    expect(html).toContain("Escrow 7");
    expect(html).toContain("Seller");
    expect(html).toContain("Manage Escrow");
    expect(html).toContain('href="/management/7"');
  });

  it("renders the first six escrows and the pager when more pages exist", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementScreenContent, {
        displayValues,
        errorMessage: null,
        escrows: Array.from({ length: 7 }, (_, index) => createEscrow(index + 1)),
        hasUser: true,
        isLoading: false,
      })
    );

    expect(html).toContain("Escrow 1");
    expect(html).toContain("Escrow 6");
    expect(html).not.toContain("Escrow 7");
    expect(html).toContain("Page 1 of 2");
    expect(html).toContain("Previous");
    expect(html).toContain("Next");
  });
});
