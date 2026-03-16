import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";
import { useAuth } from "./auth/useAuth";

vi.mock("./auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("App", () => {
  it("renders the loading state", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
      errorMessage: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByText("Checking your sign-in status...")
    ).toBeInTheDocument();
  });

  it("renders the signed out state", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      errorMessage: "Authentication failed.",
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getByRole("button", { name: "Sign in with Google" })
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Authentication failed.");
  });

  it("renders the signed in state", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      errorMessage: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByText("Hello, Taylor.")).toBeInTheDocument();
    expect(screen.getByText("taylor@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show Development Log" })
    ).toBeInTheDocument();
  });
});
