import type { ExternalSource } from "@/lib/types";

export function externalSourcesMatch(left: ExternalSource | null | undefined, right: ExternalSource) {
  return left?.provider === right.provider && left.issueId === right.issueId;
}

export function formatLinearIssueTitle(identifier: string, title: string) {
  return `${identifier} · ${title}`;
}
