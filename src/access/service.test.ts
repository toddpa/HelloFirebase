import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  allowSubscriberEmail,
  resolveUserAccess,
  reviewAccessRequest,
  runAccessDiagnostics,
  submitAccessRequest,
} from "./service";

const {
  collectionMock,
  deleteDocMock,
  docMock,
  getDocMock,
  getDocsMock,
  orderByMock,
  queryMock,
  serverTimestampMock,
  setDocMock,
  writeBatchMock,
} = vi.hoisted(() => {
  const batchSetMock = vi.fn();
  const batchCommitMock = vi.fn();

  return {
    collectionMock: vi.fn(),
    deleteDocMock: vi.fn(),
    docMock: vi.fn((...segments: unknown[]) => ({
      path: segments.slice(1).join("/"),
    })),
    getDocMock: vi.fn(),
    getDocsMock: vi.fn(),
    orderByMock: vi.fn(),
    queryMock: vi.fn(),
    serverTimestampMock: vi.fn(() => "server-timestamp"),
    setDocMock: vi.fn(),
    writeBatchMock: vi.fn(() => ({
      set: batchSetMock,
      commit: batchCommitMock,
    })),
  };
});

vi.mock("firebase/firestore", () => ({
  collection: collectionMock,
  deleteDoc: deleteDocMock,
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  orderBy: orderByMock,
  query: queryMock,
  serverTimestamp: serverTimestampMock,
  setDoc: setDocMock,
  writeBatch: writeBatchMock,
}));

vi.mock("../firebase/config", () => ({
  db: { name: "test-db" },
}));

function createSnapshot(exists: boolean, data?: Record<string, unknown>) {
  return {
    exists: () => exists,
    data: () => data,
  };
}

describe("access service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionMock.mockImplementation((...segments: unknown[]) => ({
      path: segments.slice(1).join("/"),
    }));
    orderByMock.mockImplementation((field: string, direction: string) => ({
      field,
      direction,
    }));
    queryMock.mockImplementation((target: unknown, ...constraints: unknown[]) => ({
      target,
      constraints,
    }));
  });

  it("resolves admins before checking subscriber access", async () => {
    getDocMock.mockResolvedValueOnce(createSnapshot(true, { role: "admin" }));

    await expect(
      resolveUserAccess({
        uid: "admin-1",
        email: "Admin@Example.com",
      } as never)
    ).resolves.toEqual({
      state: "admin",
      normalizedEmail: "admin@example.com",
    });

    expect(getDocMock).toHaveBeenCalledTimes(1);
    expect(getDocMock).toHaveBeenCalledWith({ path: "adminUsers/admin@example.com" });
  });

  it("resolves approved users when protected subscriber content is readable", async () => {
    getDocMock
      .mockResolvedValueOnce(createSnapshot(false))
      .mockResolvedValueOnce(createSnapshot(false))
      .mockResolvedValueOnce(createSnapshot(true, { title: "probe" }));

    await expect(
      resolveUserAccess({
        uid: "member-1",
        email: "member@example.com",
      } as never)
    ).resolves.toEqual({
      state: "approved",
      normalizedEmail: "member@example.com",
    });
  });

  it("resolves denied users from their access request when subscriber content is blocked", async () => {
    getDocMock
      .mockResolvedValueOnce(createSnapshot(false))
      .mockResolvedValueOnce(createSnapshot(true, { status: "denied" }))
      .mockRejectedValueOnce({ code: "permission-denied" });

    await expect(
      resolveUserAccess({
        uid: "user-1",
        email: "denied@example.com",
      } as never)
    ).resolves.toEqual({
      state: "denied",
      normalizedEmail: "denied@example.com",
    });
  });

  it("returns unknown when the user has no normalized email", async () => {
    await expect(
      resolveUserAccess({
        uid: "user-1",
        email: "   ",
      } as never)
    ).resolves.toEqual({
      state: "unknown",
      normalizedEmail: null,
    });

    expect(getDocMock).not.toHaveBeenCalled();
  });

  it("reports unreadable diagnostics when the access request probe is permission denied", async () => {
    getDocMock
      .mockResolvedValueOnce(createSnapshot(false))
      .mockRejectedValueOnce({ code: "permission-denied" })
      .mockResolvedValueOnce(createSnapshot(true, { title: "probe" }));

    await expect(
      runAccessDiagnostics({
        uid: "user-1",
        email: "member@example.com",
      } as never)
    ).resolves.toEqual({
      normalizedEmail: "member@example.com",
      adminMarker: "allowed:missing",
      accessRequest: "denied",
      subscriberProbe: "allowed:found",
      accessRequestStatus: "unreadable",
    });
  });

  it("blocks duplicate pending access requests", async () => {
    getDocMock.mockResolvedValueOnce(
      createSnapshot(true, {
        status: "pending",
      })
    );

    await expect(
      submitAccessRequest({
        uid: "user-1",
        email: "member@example.com",
      } as never)
    ).rejects.toThrow("An access request is already pending for this account.");

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it("creates a new access request with normalized fields", async () => {
    getDocMock.mockResolvedValueOnce(createSnapshot(false));

    await submitAccessRequest({
      uid: "user-1",
      email: " Member@Example.com ",
    } as never);

    expect(setDocMock).toHaveBeenCalledWith(
      { path: "accessRequests/member@example.com" },
      {
        email: " Member@Example.com ",
        normalizedEmail: "member@example.com",
        uid: "user-1",
        status: "pending",
        requestedAt: "server-timestamp",
        reviewedAt: null,
        reviewedBy: null,
      }
    );
  });

  it("validates approved email inputs before writing", async () => {
    await expect(
      allowSubscriberEmail(
        {
          uid: "admin-1",
          email: "admin@example.com",
        } as never,
        "not-an-email"
      )
    ).rejects.toThrow("Enter a valid email address.");

    expect(getDocMock).not.toHaveBeenCalled();
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it("writes approved emails using normalized values", async () => {
    getDocMock.mockResolvedValueOnce(createSnapshot(false));

    await allowSubscriberEmail(
      {
        uid: "admin-1",
        email: "admin@example.com",
      } as never,
      " NewPerson@Example.com "
    );

    expect(setDocMock).toHaveBeenCalledWith(
      { path: "allowedEmails/newperson@example.com" },
      {
        email: "newperson@example.com",
        normalizedEmail: "newperson@example.com",
        createdAt: "server-timestamp",
        createdBy: "admin-1",
      }
    );
  });

  it("adds the allow-list record when approving an access request", async () => {
    const batch = writeBatchMock();

    await reviewAccessRequest(
      {
        uid: "admin-1",
        email: "admin@example.com",
      } as never,
      {
        email: "pending@example.com",
        normalizedEmail: "pending@example.com",
        uid: "user-1",
        status: "pending",
        requestedAt: null,
        reviewedAt: null,
        reviewedBy: null,
      },
      "approved"
    );

    expect(writeBatchMock).toHaveBeenCalledWith({ name: "test-db" });
    expect(batch.set).toHaveBeenNthCalledWith(
      1,
      { path: "accessRequests/pending@example.com" },
      expect.objectContaining({
        status: "approved",
        reviewedAt: "server-timestamp",
        reviewedBy: "admin-1",
      }),
      { merge: true }
    );
    expect(batch.set).toHaveBeenNthCalledWith(
      2,
      { path: "allowedEmails/pending@example.com" },
      {
        email: "pending@example.com",
        normalizedEmail: "pending@example.com",
        createdAt: "server-timestamp",
        createdBy: "admin-1",
      },
      { merge: true }
    );
    expect(batch.commit).toHaveBeenCalled();
  });
});
