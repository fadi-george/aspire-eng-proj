import { markRepositoryAsSeen, type TrackedRepository } from "@/lib/graphql";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "./ui/button";

export const MarkSeenButton = ({
  name,
  owner,
}: {
  name: string;
  owner: string;
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();

  const { mutateAsync: markAsSeen } = useMutation({
    mutationFn: ({ name, owner }: { name: string; owner: string }) =>
      markRepositoryAsSeen(name, owner),
    onSuccess: (_, { name, owner }) => {
      queryClient.setQueriesData<TrackedRepository[]>(
        {
          queryKey: ["trackedRepositories"],
        },
        (data) => {
          if (!data) return [];
          return data.map((repo) =>
            repo.name === name && repo.owner === owner
              ? { ...repo, seen: true }
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
      disabled={isFetching}
      onClick={(e) => {
        e.stopPropagation();
        setIsFetching(true);
        markAsSeen({ name, owner }).finally(() => {
          setIsFetching(false);
        });
      }}
      style={{
        viewTransitionName: `mark-seen-${name}-${owner}`,
      }}
    >
      Mark seen
    </Button>
  );
};
