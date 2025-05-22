import { ConfirmDialog } from "@/components/confirmDialog";
import { MarkSeenButton } from "@/components/markSeenButton";
import { PackageTag } from "@/components/packageTag";
import { RefreshButton } from "@/components/refreshButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { hasNewRelease } from "@/lib/general";
import {
  getTrackedRepositories,
  refreshRepositories,
  untrackRepository,
  type TrackedRepository,
} from "@/lib/graphql";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const RepositoryList = () => {
  const queryClient = useQueryClient();
  const {
    data: repositories,
    isFetched,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["trackedRepositories"],
    queryFn: getTrackedRepositories,
  });

  const { mutate: untrackRepo, isPending: isRemovingRepo } = useMutation({
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
      setDeleteRepoInfo(null);
      toast.success("Repository untracked successfully!");
    },
  });

  const { mutate: refresh, isPending: isRefreshing } = useMutation({
    mutationFn: refreshRepositories,
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast.error("Failed to get latest updates");
    },
  });

  const [deleteRepoInfo, setDeleteRepoInfo] = useState<{
    name: string;
    owner: string;
    repoId: string;
  } | null>(null);

  return (
    <div className="flex flex-1 pt-10">
      <div className="w-full pb-5">
        {/* Header */}
        <span className="flex items-center gap-2 justify-between pb-2 [view-transition-name:repo-section-header]">
          <h2>Tracked Repositories</h2>
          {isFetched && (
            <RefreshButton isFetching={isRefreshing} onRefresh={refresh} />
          )}
        </span>
        <hr />

        {/* Repositories */}
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-4">
          {isLoading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            <>
              {repositories?.map((repository) => {
                const { name, owner, repoId } = repository;
                return (
                  <RepositoryCard
                    key={name}
                    repository={repository}
                    onRemove={() =>
                      setDeleteRepoInfo({
                        name: name,
                        owner: owner,
                        repoId: repoId,
                      })
                    }
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Untrack Dialog */}
      <ConfirmDialog
        open={!!deleteRepoInfo}
        isFetching={isRemovingRepo}
        title="Are you sure?"
        description={`Do you want to remove ${deleteRepoInfo?.name} from your tracked repositories?`}
        onConfirm={() => {
          if (deleteRepoInfo) {
            untrackRepo(deleteRepoInfo);
          }
        }}
        onCancel={() => {
          setDeleteRepoInfo(null);
        }}
      />
    </div>
  );
};

const LoadingCard = () => {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between mt-2">
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-[30px] h-5" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mt-2">
          <div className="flex gap-2 mb-4">
            <Skeleton className="w-15 h-4" />
            <Skeleton className="w-17 h-4" />
          </div>
          <div>
            <Skeleton className="w-full h-4 mt-2" />
            <Skeleton className="w-1/2 h-4 mt-2" />
          </div>
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const RepositoryCard = ({
  repository,
  onRemove,
}: {
  repository: TrackedRepository;
  onRemove: () => void;
}) => {
  const navigate = useNavigate({ from: "/" });

  const { owner, name, published_at, release_tag, last_seen_at, repoId } =
    repository;
  const isNewRelease = hasNewRelease({ last_seen_at, published_at });
  return (
    <Card
      key={name}
      className="gap-1 cursor-pointer"
      onClick={() => {
        navigate({
          to: `/repo/${owner}/${name}`,
          state: { repoId, last_seen_at, published_at },
        });
      }}
      style={{
        viewTransitionName: `card-${owner}-${name}`,
      }}
    >
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center gap-2">
          <span className="flex-1">{name}</span>
          {isNewRelease && <MarkSeenButton repoId={repoId} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          <div className="mt-2">
            <PackageTag
              release_tag={release_tag}
              published_at={published_at}
              last_seen_at={last_seen_at}
            />
          </div>
          <div className="mt-3 line-clamp-2">{repository.description}</div>
        </CardDescription>
      </CardContent>
    </Card>
  );
};
