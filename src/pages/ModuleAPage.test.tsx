import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { listModuleAItems } from "../moduleA/service";
import ModuleAPage from "./ModuleAPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../moduleA/service", () => ({
  listModuleAItems: vi.fn(),
  toModuleAErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Unable to load Module A items right now."
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

  it("renders the loaded list of Module A items", async () => {
    vi.mocked(listModuleAItems).mockResolvedValue([
      {
        id: "welcome",
        title: "Welcome",
        summary: "Shared notes for subscribers.",
        status: "published",
        updatedAt: null,
      },
    ]);

    render(<ModuleAPage />);

    expect(screen.getByText("Loading shared updates...")).toBeInTheDocument();
    expect(await screen.findByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Shared notes for subscribers.")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("renders the empty state when the collection has no documents", async () => {
    vi.mocked(listModuleAItems).mockResolvedValue([]);

    render(<ModuleAPage />);

    expect(await screen.findByText("No shared updates yet.")).toBeInTheDocument();
    expect(screen.getByText("Add documents to the subscriber content collection to populate Module A.")).toBeInTheDocument();
  });

  it("renders a readable error message when the read fails", async () => {
    vi.mocked(listModuleAItems).mockRejectedValue(new Error("You do not have permission to read Module A right now."));

    render(<ModuleAPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to read Module A right now."
    );
  });

  it("refreshes the list when the refresh button is clicked", async () => {
    vi.mocked(listModuleAItems)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "launch-note",
          title: "Launch note",
          summary: null,
          status: null,
          updatedAt: null,
        },
      ]);

    render(<ModuleAPage />);

    expect(await screen.findByText("No shared updates yet.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(vi.mocked(listModuleAItems)).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Launch note")).toBeInTheDocument();
  });
});
