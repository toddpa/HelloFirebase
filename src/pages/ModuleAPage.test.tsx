import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { createModuleAItem, listModuleAItems } from "../moduleA/service";
import ModuleAPage from "./ModuleAPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../moduleA/service", () => ({
  createModuleAItem: vi.fn(),
  listModuleAItems: vi.fn(),
  toModuleAErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Unable to load your notes right now."
  ),
}));

describe("ModuleAPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  it("renders the loaded list of private notes", async () => {
    vi.mocked(listModuleAItems).mockResolvedValue([
      {
        id: "welcome",
        title: "Welcome",
        body: "Private note body.",
        status: "draft",
        visibility: "private",
        authorId: "member-1",
        authorEmail: "member@example.com",
        createdAt: null,
        updatedAt: null,
        publishedAt: null,
      },
    ]);

    render(<ModuleAPage />);

    expect(screen.getByText("Loading your notes...")).toBeInTheDocument();
    expect(await screen.findByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Private note body.")).toBeInTheDocument();
  });

  it("renders the empty state when the user has no notes", async () => {
    vi.mocked(listModuleAItems).mockResolvedValue([]);

    render(<ModuleAPage />);

    expect(await screen.findByText("No notes yet.")).toBeInTheDocument();
  });

  it("renders a readable error message when the read fails", async () => {
    vi.mocked(listModuleAItems).mockRejectedValue(new Error("You do not have permission to read your notes right now."));

    render(<ModuleAPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to read your notes right now."
    );
  });

  it("saves a note and reloads the list", async () => {
    vi.mocked(listModuleAItems)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "launch-note",
          title: "Launch note",
          body: "Remember the launch checklist.",
          status: "draft",
          visibility: "private",
          authorId: "member-1",
          authorEmail: "member@example.com",
          createdAt: null,
          updatedAt: null,
          publishedAt: null,
        },
      ]);
    vi.mocked(createModuleAItem).mockResolvedValue("launch-note");

    render(<ModuleAPage />);

    expect(await screen.findByText("No notes yet.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Launch note" },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Remember the launch checklist." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() => {
      expect(vi.mocked(createModuleAItem)).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "member-1",
          email: "member@example.com",
        }),
        {
          title: "Launch note",
          body: "Remember the launch checklist.",
        }
      );
    });

    expect(await screen.findByText("Note saved. Document ID: launch-note")).toBeInTheDocument();
    expect(await screen.findByText("Launch note")).toBeInTheDocument();
  });
});
