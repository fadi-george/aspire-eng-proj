/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "@tanstack/react-router" {
  interface HistoryState {
    repoId?: string;
    last_seen_at?: string | null;
    published_at?: string | null;
  }
}

// Add ViewTransition type declaration
declare module "react" {
  export const unstable_ViewTransition: React.ComponentType<{
    children: React.ReactNode;
    enter?: string;
    exit?: string;
  }>;
}

export {};
