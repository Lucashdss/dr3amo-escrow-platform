import { AppError } from "@/lib/errors";
import { getLandingCodePreview } from "@/features/landing-code/server/landingCodeService";

describe("landingCodeService", () => {
  it("parses source into numbered lines", async () => {
    const result = await getLandingCodePreview(
      jest.fn().mockResolvedValue({
        ok: true,
        text: async () => "line one\nline two",
      }) as typeof fetch
    );

    expect(result.lines).toEqual([
      { number: 1, content: "line one" },
      { number: 2, content: "line two" },
    ]);
  });

  it("returns all 446 lines from the source", async () => {
    const source = Array.from({ length: 446 }, (_, index) => `line ${index + 1}`).join(
      "\n"
    );

    const result = await getLandingCodePreview(
      jest.fn().mockResolvedValue({
        ok: true,
        text: async () => source,
      }) as typeof fetch
    );

    expect(result.lines).toHaveLength(446);
    expect(result.lines[445]).toEqual({ number: 446, content: "line 446" });
  });

  it("throws a controlled error when GitHub fetch fails", async () => {
    await expect(
      getLandingCodePreview(
        jest.fn().mockResolvedValue({
          ok: false,
          text: async () => "",
        }) as typeof fetch
      )
    ).rejects.toEqual(new AppError("Failed to load GitHub source.", 502));
  });
});
