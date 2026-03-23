import type { ReactNode } from "react";
import { EmptyState } from "../ui";
import NoteCard from "./NoteCard";
import type { NoteDisplayOptions, NoteRecord } from "./types";

type NoteListProps = {
  notes: NoteRecord[];
  emptyTitle: string;
  emptyMessage?: string;
  ariaLabel: string;
  displayOptions?: NoteDisplayOptions;
  renderActions?: (note: NoteRecord) => ReactNode;
};

export default function NoteList({
  notes,
  emptyTitle,
  emptyMessage,
  ariaLabel,
  displayOptions,
  renderActions,
}: NoteListProps) {
  if (notes.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="record-list" aria-label={ariaLabel}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          displayOptions={displayOptions}
          actions={renderActions ? renderActions(note) : null}
        />
      ))}
    </div>
  );
}
