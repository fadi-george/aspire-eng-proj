import { hasNewRelease } from "@/lib/general";
import { useMarkRepoAsSeen } from "@/routes/_auth/-home/hooks";
import { useState } from "react";
import { Button } from "./ui/button";

export const MarkSeenButton = ({
  published_at,
  last_seen_at,
  repoId,
  owner,
  name,
}: {
  published_at: string | null;
  last_seen_at: string | null;
  repoId: string;
  owner: string;
  name: string;
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const { mutateAsync: markAsSeen } = useMarkRepoAsSeen({ owner, name });

  const isNewRelease = hasNewRelease({ last_seen_at, published_at });
  if (!isNewRelease) return null;

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
