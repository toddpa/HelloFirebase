import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import type { NoteDraft, NoteRecord } from "../../components/notes";
import {
  createDashboardNote,
  listPublishedDashboardNotes,
  listRecentDashboardNotes,
  toDashboardNotesErrorMessage,
} from "./notesService";
import { toDashboardNoteDraft, toNoteRecord } from "./mappers";

type UseDashboardNotesOptions = {
  includeUnpublished?: boolean;
};

export function useDashboardNotes(options: UseDashboardNotesOptions = {}) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextNotes = options.includeUnpublished
        ? await listRecentDashboardNotes()
        : await listPublishedDashboardNotes();
      setNotes(nextNotes.map(toNoteRecord));
    } catch (error: unknown) {
      setNotes([]);
      setErrorMessage(toDashboardNotesErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [options.includeUnpublished]);

  const createNote = useCallback(async (user: User, draft: NoteDraft) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const documentId = await createDashboardNote(user, toDashboardNoteDraft(draft));
      setSuccessMessage(`Dashboard note saved to Firestore. Document ID: ${documentId}`);
      await loadNotes();
    } catch (error: unknown) {
      setErrorMessage(toDashboardNotesErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadNotes]);

  return {
    notes,
    loading,
    isSubmitting,
    errorMessage,
    successMessage,
    refresh: loadNotes,
    createNote,
  };
}

