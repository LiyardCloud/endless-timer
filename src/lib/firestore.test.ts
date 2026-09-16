import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  batch: {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

vi.mock("firebase/firestore", () => {
  let generatedId = 0;
  const makePath = (part: unknown) => {
    if (typeof part === "object" && part && "path" in part) return String(part.path);
    if (typeof part === "object" && part && "name" in part) return "";
    return String(part);
  };

  return {
    Timestamp: { fromDate: vi.fn() },
    addDoc: vi.fn(),
    collection: vi.fn((...parts: unknown[]) => ({ path: parts.map(makePath).filter(Boolean).join("/") })),
    deleteDoc: vi.fn(),
    doc: vi.fn((...parts: unknown[]) => {
      const id = parts.length === 1 ? `event-${++generatedId}` : String(parts.at(-1));
      const parentPath = parts.map(makePath).filter(Boolean).join("/");

      return {
        id,
        path: parts.length === 1 ? `${parentPath}/${id}` : parentPath
      };
    }),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(() => "server-timestamp"),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
    writeBatch: vi.fn(() => mocks.batch)
  };
});

import { selectAction } from "@/lib/firestore";

beforeEach(() => {
  mocks.batch.set.mockClear();
  mocks.batch.update.mockClear();
  mocks.batch.commit.mockClear();
});

describe("selectAction", () => {
  it("starts a fresh manual event and clears an active external binding", async () => {
    await selectAction({
      userId: "user-1",
      action: { id: "focus", name: "Focus", color: "#265cff", icon: "brain" },
      previousHistoryEventId: "linear-event",
      previousTitle: "ENG-123 · Build OAuth flow"
    });

    expect(mocks.batch.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1/history_events/linear-event" }),
      expect.objectContaining({ titleSnapshot: "ENG-123 · Build OAuth flow" })
    );
    expect(mocks.batch.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1/history_events/event-1" }),
      expect.not.objectContaining({ externalSource: expect.anything() })
    );
    expect(mocks.batch.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-1" }),
      expect.objectContaining({ currentExternalSource: null, currentActionId: "focus" })
    );
    expect(mocks.batch.commit).toHaveBeenCalledOnce();
  });
});
