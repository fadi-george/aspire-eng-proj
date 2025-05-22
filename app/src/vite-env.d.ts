/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "@tanstack/react-router" {
  interface HistoryState {
    repoId?: string;
    last_seen_at?: string | null;
    published_at?: string | null;
  }
}

export {};
