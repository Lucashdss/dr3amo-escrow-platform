import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LandingHomePage as Home } from "@/components/landing/LandingHomePage";

const mockUseWalletAuth = jest.fn();
const mockPush = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) =>
    React.createElement("img", { alt: alt ?? "" }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

jest.mock("lucide-react", () => ({
  ExternalLink: () => React.createElement("span", null, "ExternalLink"),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

jest.mock("@/components/DecryptedText", () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => React.createElement("span", null, text),
}));

jest.mock("@/features/auth/hooks/useWalletAuth", () => ({
  useWalletAuth: () => mockUseWalletAuth(),
}));

jest.mock("@/features/analytics/components/AnalyticsProvider", () => ({
  useAnalyticsSettings: () => ({
    canManageAnalytics: false,
    openAnalyticsSettings: jest.fn(),
  }),
}));

describe("Home page", () => {
  const renderPage = () => renderToStaticMarkup(React.createElement(Home));

  const baseAuthState = {
    address: undefined,
    authError: null,
    connectError: null,
    connectors: [],
    currentUserId: null,
    hasUser: false,
    handleConnect: jest.fn(),
    handleCreateUser: jest.fn(),
    handleDisconnect: jest.fn(),
    headerLabel: "Connect Wallet",
    isCheckingUser: false,
    isConnected: false,
    isConnectModalOpen: false,
    isConnecting: false,
    isCreatingUser: false,
    isDisconnectOpen: false,
    isLoginModalOpen: false,
    isMounted: true,
    isUsernameModalOpen: false,
    openDisconnectModal: jest.fn(),
    openLoginModal: jest.fn(),
    closeDisconnectModal: jest.fn(),
    closeLoginModal: jest.fn(),
    trimmedAddress: "Connect Wallet",
    userCheckError: null,
    username: "",
    setUsername: jest.fn(),
    usernameError: null,
  };

  beforeEach(() => {
    mockPush.mockReset();
    mockUseWalletAuth.mockReturnValue(baseAuthState);
  });

  it("renders core landing page content", () => {
    const html = renderPage();

    expect(html).toContain("Dr3amo");
    expect(html).toContain("Pay the way your project needs.");
    expect(html).toContain("Secure escrow payments for any service.");
    expect(html).toContain("Stay in control of every buyer-side milestone.");
    expect(html).toContain(
      "See every active agreement, track approvals, and move projects forward from a buyer workspace built for fast decisions."
    );
    expect(html).toContain("Create a contract");
    expect(html).toContain("Contact us");
    expect(html).toContain("Buyer Dashboard");
    expect(html).toContain("See what you&#x27;re interacting with");
    expect(html).toContain("EscrowFreelance.sol");
    expect(html).toContain("GitHub");
    expect(html).toContain("FAQs");
    expect(html).toContain("How do fees work?");
    expect(html).toContain("1% fee");
    expect(html).toContain("How can we help?");
    expect(html).toContain("Enter your name");
    expect(html).toContain("Enter your email");
    expect(html).toContain("Write a message");
    expect(html).toContain("Send message");
    expect(html).toContain("Resources");
    expect(html).toContain("Buyer Workspace");
    expect(html).toContain("Privacy Policy");
  });

  it("shows the connect wallet button by default", () => {
    const html = renderPage();

    expect(html).toContain("Connect Wallet");
  });

  it("renders the 3-step escrow flow", () => {
    const html = renderPage();

    expect(html).toContain("Step 1");
    expect(html).toContain("Create a contract");
    expect(html).toContain("Step 2");
    expect(html).toContain("Fund your milestone");
    expect(html).toContain("Step 3");
    expect(html).toContain("Release when approved");
  });

  it("does not show dashboard action before connection", () => {
    const html = renderPage();

    expect(html).not.toContain("Manage Escrows");
  });

  it("shows an error message when a connection is refused", () => {
    mockUseWalletAuth.mockReturnValue({
      ...baseAuthState,
      isConnectModalOpen: true,
      connectError: "Connection cancelled.",
    });

    const html = renderPage();

    expect(html).toContain("Connection cancelled.");
  });

  it("shows create username modal when wallet user does not exist", () => {
    mockUseWalletAuth.mockReturnValue({
      ...baseAuthState,
      address: "0x1234567890abcdef1234567890abcdef12345678",
      isConnected: true,
      isUsernameModalOpen: true,
    });

    const html = renderPage();

    expect(html).toContain("Create Username");
    expect(html).toContain("no user exists yet");
  });
});
