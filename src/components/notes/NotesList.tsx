import type { DashboardNote } from "../../features/notes";
import NoteCard from "./NoteCard";

type NotesListProps = {
  notes: DashboardNote[];
  emptyTitle: string;
  emptyMessage?: string;
  ariaLabel: string;
  showAuthorEmail?: boolean;
  showPublicationStatus?: boolean;
};

export default function NotesList({
  notes,
  emptyTitle,
  emptyMessage,
  ariaLabel,
  showAuthorEmail = false,
  showPublicationStatus = false,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">{emptyTitle}</p>
        {emptyMessage ? <p className="muted-copy">{emptyMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="record-list" aria-label={ariaLabel}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          showAuthorEmail={showAuthorEmail}
          showPublicationStatus={showPublicationStatus}
        />
      ))}
    </div>
  );
}
