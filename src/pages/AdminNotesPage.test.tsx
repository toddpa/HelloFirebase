import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { createDashboardNote, listRecentDashboardNotes } from "../features/notes/notesService";
import AdminNotesPage from "./AdminNotesPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/notes/notesService", async () => {
  const actual = await vi.importActual<typeof import("../features/notes/notesService")>(
    "../features/notes/notesService"
  );

  return {
    ...actual,
    createDashboardNote: vi.fn(),
    listRecentDashboardNotes: vi.fn(),
  };
});

describe("AdminNotesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows an unauthorized state for non-admin users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<AdminNotesPage />);

    expect(
      screen.getByRole("heading", { name: "This page is restricted to administrators" })
    ).toBeInTheDocument();
  });

  it("renders the notes module with distinct headings", async () => {
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
    vi.mocked(listRecentDashboardNotes).mockResolvedValue([]);

    render(<AdminNotesPage />);

    expect(screen.getByRole("heading", { name: "Dashboard notes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create note" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent notes" })).toBeInTheDocument();
    expect(await screen.findByText("No dashboard notes yet.")).toBeInTheDocument();
  });

  it("creates a dashboard note from the notes module", async () => {
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
    vi.mocked(listRecentDashboardNotes)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "note-123",
          title: "Platform update",
          body: "Shared note copy.",
          createdAt: null,
          status: "published",
          visibility: "shared",
          authorId: "admin-1",
          authorEmail: "admin@example.com",
          updatedAt: null,
          publishedAt: null,
        },
      ]);
    vi.mocked(createDashboardNote).mockResolvedValue("note-123");

    render(<AdminNotesPage />);

    await screen.findByText("No dashboard notes yet.");

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Platform update" },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Shared note copy." },
    });
    fireEvent.click(screen.getByLabelText("Publish immediately"));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(vi.mocked(createDashboardNote)).toHaveBeenCalledWith(adminUser, {
        title: "Platform update",
        body: "Shared note copy.",
        published: false,
      });
    });

    expect(await screen.findByText("Dashboard note saved to Firestore. Document ID: note-123")).toBeInTheDocument();
    expect(screen.getByText("Platform update")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Body")).toHaveValue("");
  });

  it("shows a readable permission error when dashboard note creation fails", async () => {
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
    vi.mocked(listRecentDashboardNotes).mockResolvedValue([]);
    vi.mocked(createDashboardNote).mockRejectedValue(
      new Error("You do not have permission to save dashboard notes.")
    );

    render(<AdminNotesPage />);

    await screen.findByText("No dashboard notes yet.");

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Platform update" },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Shared note copy." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish note" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to save dashboard notes."
    );
  });
});
