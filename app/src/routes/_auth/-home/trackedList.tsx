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
import { useState } from "react";
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
      setDeleteRepoInfo(null);
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
  console.log(sortBy);

  const filteredRepos = filterRepos(repositories ?? [], filter, sortBy);

  return (
    <div className="flex flex-1 pt-10">
      <div className="w-full pb-5">
        {/* Header */}
        <span className="flex items-center gap-2 justify-between pb-2 flex-wrap [view-transition-name:repo-section-header]">
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
              {filteredRepos.length === 0 && (
                <div className="col-span-full text-center text-lg text-gray-500 pt-6">
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
