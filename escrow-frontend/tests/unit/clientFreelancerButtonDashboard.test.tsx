import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ClientFreelancerButtonDashboard } from "@/components/clientFreelancerButtonDashboard";

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

describe("ClientFreelancerButtonDashboard", () => {
  const renderComponent = () =>
    renderToStaticMarkup(React.createElement(ClientFreelancerButtonDashboard));

  it("renders buyer and seller buttons", () => {
    const html = renderComponent();

    expect(html).toContain(">Buyer<");
    expect(html).toContain(">Seller<");
  });

  it("renders links to client and freelancer dashboards", () => {
    const html = renderComponent();

    expect(html).toContain('href="/client"');
    expect(html).toContain('href="/freelancer"');
  });
});
