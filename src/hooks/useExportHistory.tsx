import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'recentExports.v1';
const MAX_ENTRIES = 5;

export interface ExportHistoryFile {
  name: string;
  rows: number;
  sizeBytes: number;
}

export interface ExportHistoryEntry {
  id: string;
  platformId: string;
  platformName: string;
  totalItems: number;
  fileCount: number;
  totalSizeBytes: number;
  isZip: boolean;
  zipFilename?: string;
  files: ExportHistoryFile[];
  /** ISO timestamp */
  createdAt: string;
}

function readStorage(): ExportHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: keep only well-formed entries
    return parsed.filter(
      (e): e is ExportHistoryEntry =>
        e &&
        typeof e.id === 'string' &&
        typeof e.platformName === 'string' &&
        typeof e.createdAt === 'string' &&
        Array.isArray(e.files),
    );
  } catch {
    return [];
  }
}

function writeStorage(entries: ExportHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    // Notify other components/tabs
    window.dispatchEvent(new CustomEvent('recent-exports-changed'));
  } catch (err) {
    console.warn('[useExportHistory] failed to persist:', err);
  }
}

/**
 * Persists the most recent export records (up to 5) in localStorage.
 * Note: file contents/blobs are NOT stored — only metadata. The summary
 * dialog still holds the cached blob for in-session re-download.
 */
export function useExportHistory() {
  const [entries, setEntries] = useState<ExportHistoryEntry[]>(() => readStorage());

  // Sync across tabs/components
  useEffect(() => {
    const refresh = () => setEntries(readStorage());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('recent-exports-changed', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('recent-exports-changed', refresh);
    };
  }, []);

  const addEntry = useCallback((entry: Omit<ExportHistoryEntry, 'id' | 'createdAt'>) => {
    const fullEntry: ExportHistoryEntry = {
      ...entry,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [fullEntry, ...readStorage()].slice(0, MAX_ENTRIES);
    writeStorage(next);
    setEntries(next);
    return fullEntry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    const next = readStorage().filter(e => e.id !== id);
    writeStorage(next);
    setEntries(next);
  }, []);

  const clearAll = useCallback(() => {
    writeStorage([]);
    setEntries([]);
  }, []);

  return { entries, addEntry, removeEntry, clearAll, maxEntries: MAX_ENTRIES };
}
