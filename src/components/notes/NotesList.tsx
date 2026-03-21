import type { DashboardNote } from "../../features/notes";
import NoteCard from "./NoteCard";

type NotesListProps = {
  notes: DashboardNote[];
  emptyTitle: string;
  emptyMessage: string;
  ariaLabel: string;
};

export default function NotesList({
  notes,
  emptyTitle,
  emptyMessage,
  ariaLabel,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">{emptyTitle}</p>
        <p className="muted-copy">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="record-list" aria-label={ariaLabel}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
