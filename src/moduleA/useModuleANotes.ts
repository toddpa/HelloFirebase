import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import type { NoteDraft, NoteRecord } from "../components/notes";
import { createModuleAItem, listModuleAItems, toModuleAErrorMessage } from "./service";
import { toModuleADraft, toNoteRecord } from "./mappers";

export function useModuleANotes() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadNotes = useCallback(async (user: User) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextItems = await listModuleAItems(user);
      setNotes(nextItems.map(toNoteRecord));
    } catch (error: unknown) {
      setNotes([]);
      setErrorMessage(toModuleAErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (user: User, draft: NoteDraft) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const documentId = await createModuleAItem(user, toModuleADraft(draft));
      setSuccessMessage(`Note saved. Document ID: ${documentId}`);
      await loadNotes(user);
    } catch (error: unknown) {
      setErrorMessage(toModuleAErrorMessage(error));
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
