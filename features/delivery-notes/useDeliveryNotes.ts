"use client";

import { useCallback, useMemo, useState } from "react";
import { initialNotes, scannedNote } from "@/lib/data";
import type { DeliveryNote } from "@/lib/types";

const matchesQuery = (note: DeliveryNote, query: string) =>
  `${note.supplier} ${note.store}`.toLowerCase().includes(query.toLowerCase());

export function useDeliveryNotes() {
  const [notes, setNotes] = useState<DeliveryNote[]>(initialNotes);
  const [query, setQuery] = useState("");

  const filteredNotes = useMemo(
    () => (query ? notes.filter((note) => matchesQuery(note, query)) : notes),
    [notes, query],
  );

  const addScannedNote = useCallback(() => {
    setNotes((current) => [{ ...scannedNote, id: Date.now() }, ...current]);
  }, []);

  return { notes, filteredNotes, query, setQuery, addScannedNote };
}
