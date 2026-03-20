import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { createModuleBRecord, toModuleBWriteErrorMessage } from "../moduleB/service";
import ModuleBPage from "./ModuleBPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../moduleB/service", () => ({
  createModuleBRecord: vi.fn(),
  toModuleBWriteErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Unable to save the Module B update right now."
  ),
}));

describe("ModuleBPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an unauthorized state for non-admin users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<ModuleBPage />);

    expect(screen.getByRole("heading", { name: "Admin access required" })).toBeInTheDocument();
    expect(vi.mocked(createModuleBRecord)).not.toHaveBeenCalled();
  });

  it("creates an admin update and clears the form on success", async () => {
    const adminUser = {
      uid: "admin-1",
      email: "admin@example.com",
    } as ReturnType<typeof useAuth>["user"];

    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "admin@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(createModuleBRecord).mockResolvedValue("new-doc-123");

    render(<ModuleBPage />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Weekly operations note" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "A short admin-only update." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save admin update" }));

    await waitFor(() => {
      expect(vi.mocked(createModuleBRecord)).toHaveBeenCalledWith(adminUser, {
        title: "Weekly operations note",
        details: "A short admin-only update.",
      });
    });

    expect(await screen.findByText("Admin update saved to Firestore. Document ID: new-doc-123")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Details")).toHaveValue("");
  });

  it("renders a readable permission error when the write fails", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "admin-1",
        email: "admin@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "admin@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(createModuleBRecord).mockRejectedValue(new Error("You do not have permission to save Module B updates."));

    render(<ModuleBPage />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Weekly operations note" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "A short admin-only update." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save admin update" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to save Module B updates."
    );
    expect(vi.mocked(toModuleBWriteErrorMessage)).toHaveBeenCalled();
  });
});
