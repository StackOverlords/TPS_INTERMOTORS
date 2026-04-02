import { create } from 'zustand';

export type DownloadStatus = 'downloading' | 'success' | 'cancelled' | 'error';
export type DownloadType = 'pdf' | 'excel' | 'image';

export interface DownloadEntry {
    id: string;
    filename: string;
    path: string | null;
    status: DownloadStatus;
    type: DownloadType;
    timestamp: number;
    error?: string;
}

interface DownloadStore {
    downloads: DownloadEntry[];
    addDownload: (entry: Omit<DownloadEntry, 'id' | 'timestamp'>) => string;
    updateDownload: (id: string, updates: Partial<Omit<DownloadEntry, 'id' | 'timestamp'>>) => void;
    removeDownload: (id: string) => void;
    clearDownloads: () => void;
}

export const useDownloadStore = create<DownloadStore>((set) => ({
    downloads: [],

    addDownload: (entry) => {
        const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({
            downloads: [{ ...entry, id, timestamp: Date.now() }, ...s.downloads].slice(0, 20),
        }));
        return id;
    },

    updateDownload: (id, updates) => {
        set((s) => ({
            downloads: s.downloads.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
    },

    removeDownload: (id) => {
        set((s) => ({ downloads: s.downloads.filter((d) => d.id !== id) }));
    },

    clearDownloads: () => set({ downloads: [] }),
}));
