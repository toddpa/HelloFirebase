import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the page copy", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show Development Log" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("This app was built entirely from an iPad.")
    ).not.toBeInTheDocument();
  });

  it("toggles the development log when clicking the button", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Show Development Log" }));

    expect(
      screen.getByText("This app was built entirely from an iPad.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("We are now using TypeScript to implement this project.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide Development Log" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide Development Log" }));

    expect(
      screen.queryByText("This app was built entirely from an iPad.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show Development Log" })
    ).toBeInTheDocument();
  });
});
