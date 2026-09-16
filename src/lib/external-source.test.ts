import { describe, expect, it } from "vitest";

import { externalSourcesMatch, formatLinearIssueTitle } from "@/lib/external-source";

const source = {
  provider: "linear" as const,
  issueId: "issue-123",
  identifier: "ENG-123"
};

describe("external sources", () => {
  it("matches only the same provider and issue identity", () => {
    expect(externalSourcesMatch(source, { ...source })).toBe(true);
    expect(externalSourcesMatch(source, { ...source, issueId: "issue-456" })).toBe(false);
    expect(externalSourcesMatch(null, source)).toBe(false);
  });

  it("formats a Linear title without deriving identity from the title", () => {
    expect(formatLinearIssueTitle("ENG-123", "Build OAuth flow")).toBe("ENG-123 · Build OAuth flow");
  });
});
