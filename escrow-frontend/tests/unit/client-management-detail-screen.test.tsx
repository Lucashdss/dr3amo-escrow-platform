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
    isLoadingLiveEscrowState: false,
    isLoadingLiveSnapshot: false,
    isLoading: false,
    liveEscrowState: null,
    liveSnapshot: null,
    refresh: jest.fn(),
    refreshLiveEscrowState: jest.fn(),
  }),
}));

jest.mock("@/features/escrows/hooks/useEscrowManagementActions", () => ({
  useEscrowManagementActions: () => ({
    actionError: null,
    actionStatus: null,
    actionSuccess: null,
    actions: [],
    amountInput: "",
    closeActionMenu: jest.fn(),
    closeSelectedAction: jest.fn(),
    deadlineExtensionInput: "",
    isActionMenuOpen: false,
    isExecuting: false,
    openActionMenu: jest.fn(),
    selectAction: jest.fn(),
    selectedAction: null,
    setAmountInput: jest.fn(),
    setDeadlineExtensionInput: jest.fn(),
    setUsdAmountInput: jest.fn(),
    submitSelectedAction: jest.fn(),
    submittedHash: null,
    usdAmountInput: "",
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

const contentProps = {
  actionError: null,
  actionStatus: null,
  actionSuccess: null,
  actions: [],
  amountInput: "",
  deadlineExtensionInput: "",
  displayValues,
  errorMessage: null,
  hasUser: true,
  isActionMenuOpen: false,
  isExecuting: false,
  isLoading: false,
  isLoadingLiveEscrowState: false,
  isLoadingLiveSnapshot: false,
  liveSnapshot: null,
  onAmountInputChange: jest.fn(),
  onCloseActionMenu: jest.fn(),
  onCloseSelectedAction: jest.fn(),
  onDeadlineExtensionInputChange: jest.fn(),
  onOpenActionMenu: jest.fn(),
  onSelectAction: jest.fn(),
  onSubmitSelectedAction: jest.fn(),
  onUsdAmountInputChange: jest.fn(),
  selectedAction: null,
  submittedHash: null,
  usdAmountInput: "",
};

describe("ClientManagementDetailScreenContent", () => {
  it("renders the loading state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        ...contentProps,
        escrow: null,
        isLoading: true,
      })
    );

    expect(html).toContain("Loading escrow detail...");
  });

  it("renders the empty state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        ...contentProps,
        escrow: null,
      })
    );

    expect(html).toContain("Escrow detail is not available.");
  });

  it("renders populated escrow detail", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        ...contentProps,
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
          tokenAddress: "0x0000000000000000000000000000000000000020",
          tokenId: 1,
        },
        liveSnapshot: {
          minimumPriceUsd: "1000000000000000000",
          modificationsRequested: 1,
        },
      })
    );

    expect(html).toContain("Landing page refresh");
    expect(html).toContain("Back to Management");
    expect(html).toContain("Base");
    expect(html).toContain("USDC");
    expect(html).toContain("Minimum price");
    expect(html).toContain("Modifications requested");
  });

  it("renders the dispute development message in the action menu", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientManagementDetailScreenContent, {
        ...contentProps,
        actions: [
          {
            description: "Start a dispute for this contract.",
            disabled: true,
            disabledReason: "on development",
            inputKind: "none",
            key: "initiateDispute",
            label: "Initiate Dispute",
          },
        ],
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
          state: "funded",
          tokenAddress: "0x0000000000000000000000000000000000000020",
          tokenId: 1,
        },
        isActionMenuOpen: true,
      })
    );

    expect(html).toContain("Initiate Dispute");
    expect(html).toContain("on development");
    expect(html).toContain("Disabled");
  });
});
