import {
  getShowcaseIndexBySlug,
  getNextShowcaseIndex,
  LANDING_SHOWCASE_ITEMS,
  shouldRedirectToPendingRoute,
} from "@/components/landing/landingShowcase";

describe("landing showcase configuration", () => {
  it("uses the required landing screenshot order", () => {
    expect(LANDING_SHOWCASE_ITEMS.map((item) => item.src)).toEqual([
      "/landingPage/buyerDashboard.png",
      "/landingPage/sellerDashboard.png",
      "/landingPage/createEscrow.png",
      "/landingPage/escrowManagement.png",
      "/landingPage/escrowDetails.png",
    ]);
  });

  it("wraps the gallery index after the last image", () => {
    expect(getNextShowcaseIndex(0, LANDING_SHOWCASE_ITEMS.length)).toBe(1);
    expect(getNextShowcaseIndex(4, LANDING_SHOWCASE_ITEMS.length)).toBe(0);
  });

  it("maps showcase slugs back to the correct landing image", () => {
    expect(getShowcaseIndexBySlug("buyer-dashboard")).toBe(0);
    expect(getShowcaseIndexBySlug("create-escrow")).toBe(2);
    expect(getShowcaseIndexBySlug("escrow-management")).toBe(3);
    expect(getShowcaseIndexBySlug("escrow-details")).toBe(4);
    expect(getShowcaseIndexBySlug("unknown")).toBe(0);
  });
});

describe("pending route redirect logic", () => {
  it("redirects only when the user is fully ready", () => {
    expect(
      shouldRedirectToPendingRoute({
        hasPendingRoute: true,
        hasUser: true,
        isCheckingUser: false,
        isConnected: true,
      })
    ).toBe(true);
  });

  it("blocks redirect while auth state is incomplete", () => {
    expect(
      shouldRedirectToPendingRoute({
        hasPendingRoute: false,
        hasUser: true,
        isCheckingUser: false,
        isConnected: true,
      })
    ).toBe(false);

    expect(
      shouldRedirectToPendingRoute({
        hasPendingRoute: true,
        hasUser: false,
        isCheckingUser: false,
        isConnected: true,
      })
    ).toBe(false);

    expect(
      shouldRedirectToPendingRoute({
        hasPendingRoute: true,
        hasUser: true,
        isCheckingUser: true,
        isConnected: true,
      })
    ).toBe(false);
  });
});
