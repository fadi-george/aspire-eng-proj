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
} from "@/lib/graphql";
import type { TrackedRepository } from "@/types/graphql";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import {
  startTransition,
  useState,
  unstable_ViewTransition as ViewTransition,
} from "react";
import { toast } from "sonner";
import Filters from "./filters";
import { filterRepos } from "./helper";

export const RepositoryList = () => {
  const queryClient = useQueryClient();
  const {
    data: repositories,
    isFetched,
    isLoading,
    isFetching: isFetchingRepos,
    refetch,
  } = useQuery({
    queryKey: ["trackedRepositories"],
    queryFn: getTrackedRepositories,
  });

  const [deleteRepoInfo, setDeleteRepoInfo] = useState<{
    name: string;
    owner: string;
    repoId: string;
  } | null>(null);
  const [filter, setFilter] = useState<{
    search: string;
    unseen: boolean;
  }>({
    search: "",
    unseen: false,
  });
  const [sortBy, setSortBy] = useState<{
    key: "name" | "published_at" | null;
    direction: "asc" | "desc" | null;
  }>({
    key: "name",
    direction: "asc",
  });

  const filteredRepos = filterRepos(repositories ?? [], filter, sortBy);

  // untrack a repo
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
      startTransition(() => {
        setDeleteRepoInfo(null);
      });
      toast.success("Repository untracked successfully!");
    },
  });

  // get latest info for all repos
  const { mutate: refresh, isPending: isRefreshing } = useMutation({
    mutationFn: refreshRepositories,
    onSuccess: async (data) => {
      refetch();
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

  return (
    <div className="flex flex-1 pt-10">
      <div className="w-full pb-5">
        {/* Header */}
        <span className="flex flex-wrap items-center justify-between gap-2 pb-2 [view-transition-name:repo-section-header]">
          <h2>Tracked Repositories</h2>
          <div className="flex items-center gap-2">
            <Filters
              filter={filter}
              setFilter={setFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
            {isFetched && (
              <RefreshButton
                isFetching={isRefreshing || isFetchingRepos}
                onRefresh={refresh}
              />
            )}
          </div>
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
              {filteredRepos.map((repository) => {
                const { name, owner, repoId } = repository;
                // const pendingDelete = deleteRepoInfo?.repoId === repoId;
                return (
                  <ViewTransition
                    key={name}
                    // exit={pendingDelete ? "zoom-out" : undefined}
                  >
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
                  </ViewTransition>
                );
              })}
              {filteredRepos.length === 0 && (
                <div className="col-span-full pt-6 text-center text-lg text-gray-500">
                  No repositories found
                </div>
              )}
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
        <CardTitle className="mt-2 flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-[30px]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mt-2">
          <div className="mb-4 flex gap-2">
            <Skeleton className="h-4 w-15" />
            <Skeleton className="h-4 w-17" />
          </div>
          <div>
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-1/2" />
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
      className="card cursor-pointer gap-1 [view-transition-class:card]"
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
        <CardTitle className="flex items-center gap-2 overflow-hidden">
          <span className="flex-1 truncate" title={name}>
            {name}
          </span>
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
            {release_tag ? (
              <PackageTag
                release_tag={release_tag}
                published_at={published_at}
                last_seen_at={last_seen_at}
              />
            ) : (
              <div className="text-sm text-gray-500">No release tag</div>
            )}
          </div>
          <div className="mt-3 line-clamp-2">{repository.description}</div>
        </CardDescription>
      </CardContent>
    </Card>
  );
};
