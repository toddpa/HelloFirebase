import { render, screen } from "@testing-library/react";
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

    expect(screen.queryByRole("heading", { name: "Notes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Drafts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Published" })).not.toBeInTheDocument();
    expect(screen.getByText("Draft content")).toBeInTheDocument();
  });

  it("renders the create route content without a duplicate create trigger", () => {
    renderLayout("/notes/new");

    expect(screen.queryByRole("button", { name: "Create New" })).not.toBeInTheDocument();
    expect(screen.getByText("Create content")).toBeInTheDocument();
  });

  it("renders the edit route content without a duplicate create trigger", () => {
    renderLayout("/notes/note-123");

    expect(screen.queryByRole("button", { name: "Create New" })).not.toBeInTheDocument();
    expect(screen.getByText("Note content")).toBeInTheDocument();
  });
});
