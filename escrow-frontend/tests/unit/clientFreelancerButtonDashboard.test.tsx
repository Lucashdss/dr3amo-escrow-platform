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

  it("renders client and freelancer buttons", () => {
    const html = renderComponent();

    expect(html).toContain(">Client<");
    expect(html).toContain(">Freelancer<");
  });

  it("renders links to client and freelancer dashboards", () => {
    const html = renderComponent();

    expect(html).toContain('href="/client"');
    expect(html).toContain('href="/freelancer"');
  });
});
