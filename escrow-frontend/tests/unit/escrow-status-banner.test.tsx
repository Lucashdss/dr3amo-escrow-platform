import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EscrowStatusBanner } from "@/features/escrows/components/EscrowStatusBanner";

describe("EscrowStatusBanner", () => {
  it("renders the error state", () => {
    const html = renderToStaticMarkup(
      React.createElement(EscrowStatusBanner, {
        createdEscrowAddress: null,
        errorMessage: "Failure",
        submittedHash: null,
        successMessage: null,
      })
    );

    expect(html).toContain("Failure");
  });

  it("renders the success state with transaction details", () => {
    const html = renderToStaticMarkup(
      React.createElement(EscrowStatusBanner, {
        createdEscrowAddress: "0xescrow",
        errorMessage: null,
        submittedHash: "0xhash",
        successMessage: "Escrow persisted successfully.",
      })
    );

    expect(html).toContain("Escrow persisted successfully.");
    expect(html).toContain("0xhash");
    expect(html).toContain("0xescrow");
  });
});
