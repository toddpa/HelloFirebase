import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { NOTE_STATUS, NOTE_VISIBILITY, listNotes, toPrivateNotesErrorMessage, type NoteRecord } from "../features/notes";
import { useAuth } from "../auth/useAuth";
import { NoteList } from "../components/notes";
import { SectionPanel } from "../components/ui";

const BODY_PREVIEW_LENGTH = 160;

function getStatusForPathname(pathname: string) {
  return pathname.endsWith("/published") ? NOTE_STATUS.published : NOTE_STATUS.draft;
}

function getPageCopy(status: typeof NOTE_STATUS.draft | typeof NOTE_STATUS.published) {
  return status === NOTE_STATUS.published
    ? {
        title: "Published notes",
        emptyTitle: "No published notes yet",
        loadingLabel: "Loading published notes...",
      }
    : {
        title: "Draft notes",
        emptyTitle: "No drafts yet",
        loadingLabel: "Loading drafts...",
      };
}

function toBodyPreview(body: string) {
  const normalizedBody = body.trim().replace(/\s+/g, " ");

  if (normalizedBody.length <= BODY_PREVIEW_LENGTH) {
    return normalizedBody;
  }

  return `${normalizedBody.slice(0, BODY_PREVIEW_LENGTH - 1).trimEnd()}...`;
}

function toPreviewNoteRecord(note: NoteRecord): NoteRecord {
  return {
    ...note,
    body: toBodyPreview(note.body),
  };
}

export default function NotesListPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const status = getStatusForPathname(pathname);
  const pageCopy = getPageCopy(status);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadNotes() {
      if (!user?.uid) {
        if (isActive) {
          setNotes([]);
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const nextNotes = await listNotes({
          visibility: NOTE_VISIBILITY.private,
          authorId: user.uid,
          status,
        });

        if (!isActive) {
          return;
        }

        setNotes(nextNotes.map(toPreviewNoteRecord));
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        setErrorMessage(toPrivateNotesErrorMessage(error));
        setNotes([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      isActive = false;
    };
  }, [status, user]);

  return (
    <SectionPanel title={pageCopy.title} eyebrow="Notes">
      {errorMessage ? (
        <p className="auth-error panel" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? <p>{pageCopy.loadingLabel}</p> : null}

      {!loading ? (
        <NoteList
          notes={notes}
          ariaLabel={pageCopy.title}
          emptyTitle={pageCopy.emptyTitle}
          displayOptions={{ showCreatedAt: false, showUpdatedAt: true }}
          itemTo={(note) => `/notes/${note.id}`}
        />
      ) : null}
    </SectionPanel>
  );
}
