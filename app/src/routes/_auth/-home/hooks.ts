import type {
  TrackedRepository,
  TrackedRepositoryRelease,
} from "@/shared/types/graphql";

import {
  markRepositoryAsSeen,
  refreshRepositories,
  searchRepositories,
  trackRepository,
  untrackRepository,
} from "@/lib/graphql";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// mutations and queries
export const useUntrackRepo = ({ onSuccess }: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId }: { repoId: string }) => untrackRepository(repoId),
    onSuccess: (_, { repoId }) => {
      queryClient.setQueriesData<TrackedRepository[]>(
        {
          queryKey: ["trackedRepositories"],
        },
        (data) => {
          if (!data) return [];
          return data.filter((repo) => repo.repoId !== repoId);
        },
      );
      onSuccess();
      toast.success("Repository untracked successfully!");
    },
  });
};

export const useRefreshRepositories = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  return useMutation({
    mutationFn: refreshRepositories,
    onSuccess: (data) => {
      onSuccess();

      if (data.failedRepos.length > 0) {
        toast.warning(
          `Some repositories failed to refresh. Check console for details.`,
        );
        console.warn("Failed repositories:", data.failedRepos);
      }
    },
    onError: () => {
      toast.error("Failed to get latest updates");
    },
  });
};

export const useSearchRepositories = ({
  searchTerm,
}: {
  searchTerm: string;
}) => {
  return useQuery({
    queryKey: ["repositories", searchTerm],
    queryFn: () => searchRepositories(searchTerm, 5),
    enabled: !!searchTerm,
  });
};

export const useTrackRepository = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId }: { repoId: string }) => trackRepository(repoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackedRepositories"] });
      toast.success("Repository tracked successfully!");
    },
    onError: () => {
      toast.error("Failed to track repository");
    },
  });
};

export const useMarkRepoAsSeen = ({
  owner,
  name,
}: {
  owner: string;
  name: string;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repoId }: { repoId: string }) =>
      markRepositoryAsSeen(repoId),
    onSuccess: (response, { repoId }) => {
      queryClient.setQueriesData<TrackedRepository[]>(
        {
          queryKey: ["trackedRepositories"],
        },
        (data) => {
          if (!data) return [];
          return data.map((repo) =>
            repo.repoId === repoId
              ? { ...repo, last_seen_at: response.last_seen_at }
              : repo,
          );
        },
      );

      queryClient.setQueriesData<TrackedRepositoryRelease>(
        {
          queryKey: ["repository", owner, name],
        },
        (data) => {
          if (!data) return undefined;
          return {
            ...data,
            last_seen_at: response.last_seen_at,
          };
        },
      );
    },
  });
};
