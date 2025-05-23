import { hasNewRelease } from "@/lib/general";
import type { TrackedRepository } from "@/lib/graphql";

export const filterRepos = (
  repositories: TrackedRepository[],
  filter: { search: string; unseen: boolean | null },
  sortBy: {
    key: "name" | "published_at" | null;
    direction: "asc" | "desc" | null;
  },
) => {
  const search = filter.search.toLowerCase();
  let filtered = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search) ||
      repo.owner.toLowerCase().includes(search),
  );

  if (filter.unseen) {
    filtered = filtered.filter((repo) =>
      hasNewRelease({
        last_seen_at: repo.last_seen_at,
        published_at: repo.published_at,
      }),
    );
  }

  if (sortBy.direction) {
    if (sortBy.key === "name") {
      filtered.sort((a, b) =>
        sortBy.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
    }

    if (sortBy.key === "published_at") {
      filtered.sort((a, b) => {
        if (!a.published_at && !b.published_at) return 0;
        if (!a.published_at) return sortBy.direction === "asc" ? 1 : -1;
        if (!b.published_at) return sortBy.direction === "asc" ? -1 : 1;

        return sortBy.direction === "asc"
          ? a.published_at.localeCompare(b.published_at)
          : b.published_at.localeCompare(a.published_at);
      });
    }
  }

  return filtered;
};
