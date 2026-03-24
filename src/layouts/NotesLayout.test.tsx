import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NotesLayout from "./NotesLayout";

describe("NotesLayout", () => {
  function renderLayout(initialPathname: string) {
    return render(
      <MemoryRouter initialEntries={[initialPathname]}>
        <Routes>
          <Route path="/notes" element={<NotesLayout />}>
            <Route path="drafts" element={<div>Draft content</div>} />
            <Route path="published" element={<div>Published content</div>} />
            <Route path="new" element={<div>Create content</div>} />
            <Route path=":noteId" element={<div>Note content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  it("renders the notes workspace shell", () => {
    renderLayout("/notes/drafts");

    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Note" })).toHaveAttribute("href", "/notes/new");
    expect(screen.getByRole("link", { name: "Drafts" })).toHaveAttribute("href", "/notes/drafts");
    expect(screen.getByRole("link", { name: "Published" })).toHaveAttribute("href", "/notes/published");
    expect(screen.getByText("Draft content")).toBeInTheDocument();
  });

  it("keeps the secondary nav functional", () => {
    renderLayout("/notes/drafts");

    fireEvent.click(screen.getByRole("link", { name: "Published" }));
    expect(screen.getByText("Published content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Create Note" }));
    expect(screen.getByText("Create content")).toBeInTheDocument();
  });
});
