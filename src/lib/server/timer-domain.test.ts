import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn()
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: mocks.getAdminDb
}));

import { detachExternalActivity, startExternalActivity, updateExternalTitle } from "@/lib/server/timer-domain";

type Ref = {
  id: string;
  path: string;
  collection: (name: string) => { doc: (id?: string) => Ref };
};

function createRef(path: string, generatedIds: { next: number }): Ref {
  return {
    id: path.split("/").at(-1)!,
    path,
    collection: (name) => ({
      doc: (id) => createRef(`${path}/${name}/${id ?? `generated-${generatedIds.next++}`}`, generatedIds)
    })
  };
}

function createDb(
  userData: Record<string, unknown>,
  options: { actionExists?: boolean; receiptData?: Record<string, unknown> } = {}
) {
  const { actionExists = true, receiptData } = options;
  const generatedIds = { next: 1 };
  const transaction = {
    get: vi.fn(async (ref: Ref) => {
      if (ref.path.includes("processed_transitions")) {
        return { exists: Boolean(receiptData), data: () => receiptData };
      }
      if (ref.path.endsWith("/actions/focus")) {
        return {
          exists: actionExists,
          data: () => ({ name: "Focus", color: "#265cff", icon: "brain" })
        };
      }
      return { exists: true, data: () => userData };
    }),
    update: vi.fn(),
    create: vi.fn()
  };
  const db = {
    doc: (path: string) => createRef(path, generatedIds),
    runTransaction: async <T>(callback: (value: typeof transaction) => Promise<T>) => callback(transaction)
  };

  mocks.getAdminDb.mockReturnValue(db);
  return transaction;
}

const source = {
  provider: "linear" as const,
  issueId: "issue-123",
  identifier: "ENG-123",
  url: "https://linear.app/acme/issue/ENG-123"
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("timer domain", () => {
  it("switches activity atomically and records an idempotency receipt", async () => {
    const transaction = createDb({ currentHistoryEventId: "previous-event", currentTitle: "Earlier work" });

    await expect(
      startExternalActivity({
        userId: "user-1",
        actionId: "focus",
        title: "ENG-123 · Build OAuth flow",
        source,
        transitionKey: "issue-123:2026-09-16T20:00:00.000Z"
      })
    ).resolves.toEqual({ applied: true, historyEventId: "generated-1" });

    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1/history_events/previous-event" }),
      expect.objectContaining({ titleSnapshot: "Earlier work" })
    );
    expect(transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1/history_events/generated-1" }),
      expect.objectContaining({ externalSource: source, titleSnapshot: "" })
    );
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1" }),
      expect.objectContaining({ currentTitle: "ENG-123 · Build OAuth flow", currentExternalSource: source })
    );
    expect(transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining("processed_transitions") }),
      expect.objectContaining({ historyEventId: "generated-1" })
    );
  });

  it("does not create another event when the transition was already processed", async () => {
    const transaction = createDb(
      { currentHistoryEventId: "previous-event", currentTitle: "Earlier work" },
      { receiptData: { historyEventId: "existing-event" } }
    );

    await expect(
      startExternalActivity({
        userId: "user-1",
        actionId: "focus",
        title: "ENG-123 · Build OAuth flow",
        source,
        transitionKey: "issue-123:2026-09-16T20:00:00.000Z"
      })
    ).resolves.toEqual({ applied: false, historyEventId: "existing-event" });

    expect(transaction.create).not.toHaveBeenCalled();
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("updates or detaches only the matching active Linear issue", async () => {
    const userData = { currentExternalSource: source, currentTitle: "Old Linear title" };
    let transaction = createDb(userData);

    await expect(updateExternalTitle({ userId: "user-1", source, title: "New Linear title" })).resolves.toBe(true);
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1" }),
      expect.objectContaining({ currentTitle: "New Linear title" })
    );

    transaction = createDb(userData);
    await expect(detachExternalActivity({ userId: "user-1", source })).resolves.toBe(true);
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1" }),
      expect.objectContaining({ currentExternalSource: null })
    );

    transaction = createDb({ currentExternalSource: { ...source, issueId: "another-issue" } });
    await expect(updateExternalTitle({ userId: "user-1", source, title: "Ignored" })).resolves.toBe(false);
    expect(transaction.update).not.toHaveBeenCalled();
  });
});
