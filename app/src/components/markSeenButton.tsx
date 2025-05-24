import { markRepositoryAsSeen } from "@/lib/graphql";
import type { TrackedRepository } from "@/types/graphql";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "./ui/button";

export const MarkSeenButton = ({ repoId }: { repoId: string }) => {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();

  const { mutateAsync: markAsSeen } = useMutation({
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
              ? { ...repo, last_seen_at: response.lastSeenAt }
              : repo,
          );
        },
      );
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isFetching || !repoId}
      onClick={(e) => {
        e.stopPropagation();
        setIsFetching(true);
        markAsSeen({ repoId }).finally(() => {
          setIsFetching(false);
        });
      }}
      style={
        {
          // viewTransitionName: `mark-seen-${repoId}`,
        }
      }
    >
      Mark seen
    </Button>
  );
};
