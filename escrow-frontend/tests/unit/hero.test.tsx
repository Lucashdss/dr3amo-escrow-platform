import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Hero } from "@/components/landing/Hero";

jest.mock("@/components/DecryptedText", () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => React.createElement("span", null, text),
}));

describe("Hero", () => {
  it("renders the client step flow by default", () => {
    const html = renderToStaticMarkup(
      React.createElement(Hero, { isFreelancerView: false }),
    );

    expect(html).toContain("Create a contract");
    expect(html).toContain("Fund your milestone");
    expect(html).toContain("Release when approved");
    expect(html).not.toContain("Set your minimum price");
  });

  it("renders a freelancer-specific step flow", () => {
    const html = renderToStaticMarkup(
      React.createElement(Hero, { isFreelancerView: true }),
    );

    expect(html).toContain("Set your minimum price");
    expect(html).toContain("Submit your work");
    expect(html).toContain("Get paid when approved");
    expect(html).not.toContain("Create a contract");
  });
});
